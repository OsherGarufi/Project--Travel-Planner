using Backend.Dtos.Itinerary;
using Backend.Models;
using Npgsql;

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
    /// Returns null when the trip does not exist or does not
    /// belong to the user.
    /// </summary>
    public async Task<List<TripItineraryItem>?>
        GetTripItineraryForUserAsync(
            Guid tripId,
            Guid userId
        )
    {
        var items = new List<TripItineraryItem>();

        await using var connection =
            new NpgsqlConnection(GetConnectionString());

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
            i.created_at,
            i.updated_at
        FROM trips t
        LEFT JOIN trip_itinerary_items i
            ON i.trip_id = t.id
        WHERE t.id = @trip_id
          AND t.user_id = @user_id
        ORDER BY
            i.itinerary_date ASC,
            i.start_time ASC NULLS LAST,
            i.created_at ASC;
        """;

        await using var command =
            new NpgsqlCommand(sql, connection);

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

        if (reader.IsDBNull(reader.GetOrdinal("id")))
        {
            return items;
        }

        do
        {
            items.Add(MapTripItineraryItem(reader));
        }
        while (await reader.ReadAsync());

        return items;
    }

    /// <summary>
    /// Creates an itinerary item only if the trip belongs to
    /// the specified user and the itinerary date is inside the
    /// trip date range.
    /// </summary>
    public async Task<TripItineraryItem?>
        CreateTripItineraryItemForUserAsync(
            Guid tripId,
            Guid userId,
            CreateTripItineraryItemRequest request
        )
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

        const string sql = """
        INSERT INTO trip_itinerary_items (
            trip_id,
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
          AND @itinerary_date
              BETWEEN t.start_date AND t.end_date
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
            new NpgsqlCommand(sql, connection);

        AddCommonParameters(
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

        return MapTripItineraryItem(reader);
    }

    /// <summary>
    /// Updates an itinerary item only if it belongs to the
    /// specified trip, the trip belongs to the specified user,
    /// and the new itinerary date is inside the trip date range.
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
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

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
          AND @itinerary_date
              BETWEEN t.start_date AND t.end_date
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
            new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue(
            "item_id",
            itemId
        );

        AddCommonParameters(
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

        return MapTripItineraryItem(reader);
    }

    /// <summary>
    /// Deletes an itinerary item only if it belongs to the
    /// specified trip and the trip belongs to the specified user.
    /// </summary>
    public async Task<bool>
        DeleteTripItineraryItemForUserAsync(
            Guid tripId,
            Guid itemId,
            Guid userId
        )
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

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
            new NpgsqlCommand(sql, connection);

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
    /// </summary>
    private static void AddCommonParameters(
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

        command.Parameters.AddWithValue(
            "description",
            string.IsNullOrWhiteSpace(request.Description)
                ? DBNull.Value
                : request.Description.Trim()
        );

        command.Parameters.AddWithValue(
            "category",
            NormalizeCategory(request.Category)
        );

        command.Parameters.AddWithValue(
            "itinerary_date",
            request.ItineraryDate!.Value
        );

        command.Parameters.AddWithValue(
            "start_time",
            request.StartTime.HasValue
                ? request.StartTime.Value
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "end_time",
            request.EndTime.HasValue
                ? request.EndTime.Value
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "reference_url",
            string.IsNullOrWhiteSpace(request.ReferenceUrl)
                ? DBNull.Value
                : request.ReferenceUrl.Trim()
        );
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
            CollapseWhitespace(category);

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

        return builtInCategory ?? normalizedCategory;
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
    private static TripItineraryItem MapTripItineraryItem(
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

            ItineraryDate =
                reader.GetFieldValue<DateOnly>(
                    reader.GetOrdinal(
                        "itinerary_date"
                    )
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
}