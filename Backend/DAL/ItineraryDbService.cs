using Backend.Dtos.Itinerary;
using Backend.Models;
using Npgsql;
using NpgsqlTypes;

namespace Backend.DAL;

public class ItineraryDbService
{
    private readonly IConfiguration _configuration;

    public ItineraryDbService(
        IConfiguration configuration
    )
    {
        _configuration = configuration;
    }

    /// <summary>
    /// Reads the database connection string from configuration.
    /// </summary>
    private string GetConnectionString()
    {
        var connectionString =
            _configuration.GetConnectionString(
                "DefaultConnection"
            );

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Missing database connection string."
            );
        }

        return connectionString;
    }

    /// <summary>
    /// Returns all itinerary items for a trip only if the trip
    /// belongs to the specified user.
    /// Includes linked expense cost and currency when available.
    /// Returns null when the trip does not exist or does not
    /// belong to the user.
    /// </summary>
    public async Task<List<TripItineraryItemResponse>?>
        GetTripItineraryForUserAsync(
            Guid tripId,
            Guid userId
        )
    {
        var items =
            new List<TripItineraryItemResponse>();

        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        const string sql = """
        SELECT
            i.id,
            i.trip_id,
            i.expense_id,
            i.title,
            i.description,
            i.category,
            i.itinerary_date,
            i.start_time,
            i.end_time,
            i.reference_url,
            e.amount AS cost,
            e.currency AS expense_currency,
            i.created_at,
            i.updated_at
        FROM trips t
        LEFT JOIN trip_itinerary_items i
            ON i.trip_id = t.id
        LEFT JOIN trip_expenses e
            ON e.id = i.expense_id
           AND e.trip_id = i.trip_id
        WHERE t.id = @trip_id
          AND t.user_id = @user_id
        ORDER BY
            i.itinerary_date ASC NULLS LAST,
            i.start_time ASC NULLS LAST,
            i.created_at ASC;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection
            );

        command.Parameters.AddWithValue(
            "trip_id",
            tripId
        );

        command.Parameters.AddWithValue(
            "user_id",
            userId
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        if (
            reader.IsDBNull(
                reader.GetOrdinal("id")
            )
        )
        {
            return items;
        }

        do
        {
            items.Add(
                MapTripItineraryItemResponse(
                    reader
                )
            );
        }
        while (
            await reader.ReadAsync()
        );

        return items;
    }

    /// <summary>
    /// Reads a single itinerary item using an existing
    /// connection and optional transaction.
    ///
    /// Used by backend business logic to determine whether the
    /// activity is currently free or linked to an expense.
    /// </summary>
    internal async Task<TripItineraryItem?>
        GetTripItineraryItemForUserAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid itemId,
            Guid userId
        )
    {
        const string sql = """
        SELECT
            i.id,
            i.trip_id,
            i.expense_id,
            i.title,
            i.description,
            i.category,
            i.itinerary_date,
            i.start_time,
            i.end_time,
            i.reference_url,
            i.created_at,
            i.updated_at
        FROM trip_itinerary_items i
        INNER JOIN trips t
            ON t.id = i.trip_id
        WHERE i.id = @item_id
          AND i.trip_id = @trip_id
          AND t.user_id = @user_id
        LIMIT 1
        FOR UPDATE OF i;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
            );

        command.Parameters.AddWithValue(
            "item_id",
            itemId
        );

        command.Parameters.AddWithValue(
            "trip_id",
            tripId
        );

        command.Parameters.AddWithValue(
            "user_id",
            userId
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTripItineraryItem(
            reader
        );
    }

    /// <summary>
    /// Returns the itinerary item linked to a specific expense,
    /// using an existing database connection and transaction.
    ///
    /// The itinerary row is locked for update so expense and
    /// itinerary synchronization can be completed atomically.
    /// Returns null when the expense has no linked itinerary item.
    /// </summary>
    internal async Task<TripItineraryItem?>
        GetLinkedItineraryItemForExpenseAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid expenseId,
            Guid userId
        )
    {
        const string sql = """
        SELECT
            i.id,
            i.trip_id,
            i.expense_id,
            i.title,
            i.description,
            i.category,
            i.itinerary_date,
            i.start_time,
            i.end_time,
            i.reference_url,
            i.created_at,
            i.updated_at
        FROM trip_itinerary_items i
        INNER JOIN trips t
            ON t.id = i.trip_id
        WHERE i.trip_id = @trip_id
          AND i.expense_id = @expense_id
          AND t.user_id = @user_id
        LIMIT 1
        FOR UPDATE OF i;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
            );

        command.Parameters.AddWithValue(
            "trip_id",
            tripId
        );

        command.Parameters.AddWithValue(
            "expense_id",
            expenseId
        );

        command.Parameters.AddWithValue(
            "user_id",
            userId
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTripItineraryItem(
            reader
        );
    }

    /// <summary>
    /// Creates a standalone itinerary item using its own
    /// database connection.
    /// </summary>
    public async Task<TripItineraryItem?>
        CreateTripItineraryItemForUserAsync(
            Guid tripId,
            Guid userId,
            CreateTripItineraryItemRequest request
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        return await CreateTripItineraryItemForUserAsync(
            connection,
            transaction: null,
            tripId,
            userId,
            expenseId: null,
            request
        );
    }

    /// <summary>
    /// Creates an itinerary item using an existing connection
    /// and optional transaction.
    ///
    /// ExpenseId is supplied only by backend business logic.
    /// </summary>
    internal async Task<TripItineraryItem?>
        CreateTripItineraryItemForUserAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid userId,
            Guid? expenseId,
            CreateTripItineraryItemRequest request
        )
    {
        const string sql = """
        INSERT INTO trip_itinerary_items (
            trip_id,
            expense_id,
            title,
            description,
            category,
            itinerary_date,
            start_time,
            end_time,
            reference_url
        )
        SELECT
            t.id,
            @expense_id,
            @title,
            @description,
            @category,
            @itinerary_date,
            @start_time,
            @end_time,
            @reference_url
        FROM trips t
        WHERE t.id = @trip_id
          AND t.user_id = @user_id
          AND (
              @itinerary_date IS NULL
              OR @itinerary_date
                  BETWEEN t.start_date AND t.end_date
          )
          AND (
              @expense_id IS NULL
              OR EXISTS (
                  SELECT 1
                  FROM trip_expenses e
                  WHERE e.id = @expense_id
                    AND e.trip_id = t.id
              )
          )
        RETURNING
            id,
            trip_id,
            expense_id,
            title,
            description,
            category,
            itinerary_date,
            start_time,
            end_time,
            reference_url,
            created_at,
            updated_at;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
            );

        AddBaseParameters(
            command,
            tripId,
            userId,
            request
        );

        var expenseIdParameter =
            command.Parameters.Add(
                "expense_id",
                NpgsqlDbType.Uuid
            );

        expenseIdParameter.Value =
            expenseId.HasValue
                ? expenseId.Value
                : DBNull.Value;

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTripItineraryItem(
            reader
        );
    }

    /// <summary>
    /// Updates an itinerary item using its own database
    /// connection.
    /// </summary>
    public async Task<TripItineraryItem?>
        UpdateTripItineraryItemForUserAsync(
            Guid tripId,
            Guid itemId,
            Guid userId,
            UpdateTripItineraryItemRequest request
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        return await UpdateTripItineraryItemForUserAsync(
            connection,
            transaction: null,
            tripId,
            itemId,
            userId,
            request
        );
    }

    /// <summary>
    /// Updates an itinerary item using an existing database
    /// connection and optional transaction.
    ///
    /// ExpenseId is deliberately not updated here, so an
    /// existing itinerary-expense link is preserved.
    /// </summary>
    internal async Task<TripItineraryItem?>
        UpdateTripItineraryItemForUserAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid itemId,
            Guid userId,
            UpdateTripItineraryItemRequest request
        )
    {
        const string sql = """
        UPDATE trip_itinerary_items i
        SET
            title = @title,
            description = @description,
            category = @category,
            itinerary_date = @itinerary_date,
            start_time = @start_time,
            end_time = @end_time,
            reference_url = @reference_url
        FROM trips t
        WHERE i.id = @item_id
          AND i.trip_id = @trip_id
          AND t.id = i.trip_id
          AND t.user_id = @user_id
          AND (
              @itinerary_date IS NULL
              OR @itinerary_date
                  BETWEEN t.start_date AND t.end_date
          )
        RETURNING
            i.id,
            i.trip_id,
            i.expense_id,
            i.title,
            i.description,
            i.category,
            i.itinerary_date,
            i.start_time,
            i.end_time,
            i.reference_url,
            i.created_at,
            i.updated_at;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
            );

        command.Parameters.AddWithValue(
            "item_id",
            itemId
        );

        AddBaseParameters(
            command,
            tripId,
            userId,
            request
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTripItineraryItem(
            reader
        );
    }

    /// <summary>
    /// Links an existing free itinerary item to an existing
    /// expense using the same database connection and
    /// transaction.
    ///
    /// The method refuses to overwrite an existing ExpenseId.
    /// It also verifies that the expense belongs to the same
    /// trip.
    /// </summary>
    internal async Task<TripItineraryItem?>
        AttachExpenseToItineraryItemForUserAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid itemId,
            Guid expenseId,
            Guid userId
        )
    {
        const string sql = """
        UPDATE trip_itinerary_items i
        SET
            expense_id = @expense_id
        FROM trips t
        WHERE i.id = @item_id
          AND i.trip_id = @trip_id
          AND i.expense_id IS NULL
          AND t.id = i.trip_id
          AND t.user_id = @user_id
          AND EXISTS (
              SELECT 1
              FROM trip_expenses e
              WHERE e.id = @expense_id
                AND e.trip_id = i.trip_id
          )
        RETURNING
            i.id,
            i.trip_id,
            i.expense_id,
            i.title,
            i.description,
            i.category,
            i.itinerary_date,
            i.start_time,
            i.end_time,
            i.reference_url,
            i.created_at,
            i.updated_at;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
            );

        command.Parameters.AddWithValue(
            "item_id",
            itemId
        );

        command.Parameters.AddWithValue(
            "trip_id",
            tripId
        );

        command.Parameters.AddWithValue(
            "expense_id",
            expenseId
        );

        command.Parameters.AddWithValue(
            "user_id",
            userId
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTripItineraryItem(
            reader
        );
    }


    /// <summary>
    /// Moves only itinerary items that fall outside the new trip
    /// date range to Global Unscheduled.
    ///
    /// Activities that remain inside the new trip range are not
    /// modified.
    ///
    /// Already-global-unscheduled items are also left unchanged.
    /// </summary>
    internal async Task<int>
        MoveOutOfRangeItemsToGlobalUnscheduledAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid userId,
            DateOnly newStartDate,
            DateOnly newEndDate
        )
    {
        const string sql = """
    UPDATE trip_itinerary_items i
    SET
        itinerary_date = NULL,
        start_time = NULL,
        end_time = NULL
    FROM trips t
    WHERE i.trip_id = @trip_id
      AND t.id = i.trip_id
      AND t.user_id = @user_id
      AND i.itinerary_date IS NOT NULL
      AND (
          i.itinerary_date < @new_start_date
          OR i.itinerary_date > @new_end_date
      );
    """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
            );

        command.Parameters.AddWithValue(
            "trip_id",
            tripId
        );

        command.Parameters.AddWithValue(
            "user_id",
            userId
        );

        command.Parameters.AddWithValue(
            "new_start_date",
            newStartDate
        );

        command.Parameters.AddWithValue(
            "new_end_date",
            newEndDate
        );

        return await command.ExecuteNonQueryAsync();
    }


    /// <summary>
    /// Deletes an itinerary item using its own database connection.
    /// This keeps the standalone DAL operation available.
    /// </summary>
    public async Task<bool>
        DeleteTripItineraryItemForUserAsync(
            Guid tripId,
            Guid itemId,
            Guid userId
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        return await DeleteTripItineraryItemForUserAsync(
            connection,
            transaction: null,
            tripId,
            itemId,
            userId
        );
    }

    /// <summary>
    /// Deletes an itinerary item using an existing database
    /// connection and optional transaction.
    ///
    /// This overload allows a linked itinerary item and expense
    /// to be deleted atomically by the business service.
    /// </summary>
    internal async Task<bool>
        DeleteTripItineraryItemForUserAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid itemId,
            Guid userId
        )
    {
        const string sql = """
        DELETE FROM trip_itinerary_items i
        USING trips t
        WHERE i.id = @item_id
          AND i.trip_id = @trip_id
          AND t.id = i.trip_id
          AND t.user_id = @user_id
        RETURNING i.id;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
            );

        command.Parameters.AddWithValue(
            "item_id",
            itemId
        );

        command.Parameters.AddWithValue(
            "trip_id",
            tripId
        );

        command.Parameters.AddWithValue(
            "user_id",
            userId
        );

        var deletedItemId =
            await command.ExecuteScalarAsync();

        return deletedItemId is not null;
    }

    /// <summary>
    /// Adds the parameters shared by itinerary create and
    /// update operations.
    /// Nullable values use explicit PostgreSQL types.
    /// </summary>
    private static void AddBaseParameters(
        NpgsqlCommand command,
        Guid tripId,
        Guid userId,
        TripItineraryItemRequestBase request
    )
    {
        command.Parameters.AddWithValue(
            "trip_id",
            tripId
        );

        command.Parameters.AddWithValue(
            "user_id",
            userId
        );

        command.Parameters.AddWithValue(
            "title",
            request.Title.Trim()
        );

        var descriptionParameter =
            command.Parameters.Add(
                "description",
                NpgsqlDbType.Varchar
            );

        descriptionParameter.Value =
            string.IsNullOrWhiteSpace(
                request.Description
            )
                ? DBNull.Value
                : request.Description.Trim();

        command.Parameters.AddWithValue(
            "category",
            NormalizeCategory(
                request.Category
            )
        );

        var itineraryDateParameter =
            command.Parameters.Add(
                "itinerary_date",
                NpgsqlDbType.Date
            );

        itineraryDateParameter.Value =
            request.ItineraryDate.HasValue
                ? request.ItineraryDate.Value
                : DBNull.Value;

        var startTimeParameter =
            command.Parameters.Add(
                "start_time",
                NpgsqlDbType.Time
            );

        startTimeParameter.Value =
            request.StartTime.HasValue
                ? request.StartTime.Value
                : DBNull.Value;

        var endTimeParameter =
            command.Parameters.Add(
                "end_time",
                NpgsqlDbType.Time
            );

        endTimeParameter.Value =
            request.EndTime.HasValue
                ? request.EndTime.Value
                : DBNull.Value;

        var referenceUrlParameter =
            command.Parameters.Add(
                "reference_url",
                NpgsqlDbType.Varchar
            );

        referenceUrlParameter.Value =
            string.IsNullOrWhiteSpace(
                request.ReferenceUrl
            )
                ? DBNull.Value
                : request.ReferenceUrl.Trim();
    }

    /// <summary>
    /// Normalizes built-in categories while preserving custom
    /// category capitalization.
    /// </summary>
    private static string NormalizeCategory(
        string category
    )
    {
        var normalizedCategory =
            CollapseWhitespace(
                category
            );

        string[] builtInCategories =
        [
            "Flights",
            "Accommodation",
            "Food",
            "Transportation",
            "Activities",
            "Shopping",
            "Insurance",
            "Other"
        ];

        var builtInCategory =
            builtInCategories.FirstOrDefault(
                item => string.Equals(
                    item,
                    normalizedCategory,
                    StringComparison.OrdinalIgnoreCase
                )
            );

        return builtInCategory
            ?? normalizedCategory;
    }

    /// <summary>
    /// Trims a string and replaces repeated whitespace with
    /// single spaces.
    /// </summary>
    private static string CollapseWhitespace(
        string value
    )
    {
        return string.Join(
            ' ',
            value.Split(
                (char[]?)null,
                StringSplitOptions.RemoveEmptyEntries
            )
        );
    }

    /// <summary>
    /// Maps a database row into a TripItineraryItem model.
    /// </summary>
    private static TripItineraryItem
        MapTripItineraryItem(
            NpgsqlDataReader reader
        )
    {
        return new TripItineraryItem
        {
            Id = reader.GetGuid(
                reader.GetOrdinal("id")
            ),

            TripId = reader.GetGuid(
                reader.GetOrdinal("trip_id")
            ),

            ExpenseId = reader.IsDBNull(
                reader.GetOrdinal("expense_id")
            )
                ? null
                : reader.GetGuid(
                    reader.GetOrdinal("expense_id")
                ),

            Title = reader.GetString(
                reader.GetOrdinal("title")
            ),

            Description = reader.IsDBNull(
                reader.GetOrdinal("description")
            )
                ? null
                : reader.GetString(
                    reader.GetOrdinal("description")
                ),

            Category = reader.GetString(
                reader.GetOrdinal("category")
            ),

            ItineraryDate = reader.IsDBNull(
                reader.GetOrdinal("itinerary_date")
            )
                ? null
                : reader.GetFieldValue<DateOnly>(
                    reader.GetOrdinal("itinerary_date")
                ),

            StartTime = reader.IsDBNull(
                reader.GetOrdinal("start_time")
            )
                ? null
                : reader.GetFieldValue<TimeOnly>(
                    reader.GetOrdinal("start_time")
                ),

            EndTime = reader.IsDBNull(
                reader.GetOrdinal("end_time")
            )
                ? null
                : reader.GetFieldValue<TimeOnly>(
                    reader.GetOrdinal("end_time")
                ),

            ReferenceUrl = reader.IsDBNull(
                reader.GetOrdinal("reference_url")
            )
                ? null
                : reader.GetString(
                    reader.GetOrdinal("reference_url")
                ),

            CreatedAt = reader.GetDateTime(
                reader.GetOrdinal("created_at")
            ),

            UpdatedAt = reader.GetDateTime(
                reader.GetOrdinal("updated_at")
            )
        };
    }

    /// <summary>
    /// Maps an itinerary query with optional linked expense
    /// data into the API response model.
    /// </summary>
    private static TripItineraryItemResponse
        MapTripItineraryItemResponse(
            NpgsqlDataReader reader
        )
    {
        return new TripItineraryItemResponse
        {
            Id = reader.GetGuid(
                reader.GetOrdinal("id")
            ),

            TripId = reader.GetGuid(
                reader.GetOrdinal("trip_id")
            ),

            ExpenseId = reader.IsDBNull(
                reader.GetOrdinal("expense_id")
            )
                ? null
                : reader.GetGuid(
                    reader.GetOrdinal("expense_id")
                ),

            Title = reader.GetString(
                reader.GetOrdinal("title")
            ),

            Description = reader.IsDBNull(
                reader.GetOrdinal("description")
            )
                ? null
                : reader.GetString(
                    reader.GetOrdinal("description")
                ),

            Category = reader.GetString(
                reader.GetOrdinal("category")
            ),

            ItineraryDate = reader.IsDBNull(
                reader.GetOrdinal("itinerary_date")
            )
                ? null
                : reader.GetFieldValue<DateOnly>(
                    reader.GetOrdinal("itinerary_date")
                ),

            StartTime = reader.IsDBNull(
                reader.GetOrdinal("start_time")
            )
                ? null
                : reader.GetFieldValue<TimeOnly>(
                    reader.GetOrdinal("start_time")
                ),

            EndTime = reader.IsDBNull(
                reader.GetOrdinal("end_time")
            )
                ? null
                : reader.GetFieldValue<TimeOnly>(
                    reader.GetOrdinal("end_time")
                ),

            ReferenceUrl = reader.IsDBNull(
                reader.GetOrdinal("reference_url")
            )
                ? null
                : reader.GetString(
                    reader.GetOrdinal("reference_url")
                ),

            Cost = reader.IsDBNull(
                reader.GetOrdinal("cost")
            )
                ? null
                : reader.GetDecimal(
                    reader.GetOrdinal("cost")
                ),

            Currency = reader.IsDBNull(
                reader.GetOrdinal("expense_currency")
            )
                ? null
                : reader.GetString(
                    reader.GetOrdinal("expense_currency")
                ).Trim(),

            CreatedAt = reader.GetDateTime(
                reader.GetOrdinal("created_at")
            ),

            UpdatedAt = reader.GetDateTime(
                reader.GetOrdinal("updated_at")
            )
        };
    }
}