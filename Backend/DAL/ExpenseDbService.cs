using Backend.Dtos.Expenses;
using Backend.Models;
using Npgsql;
using NpgsqlTypes;

namespace Backend.DAL;

public class ExpenseDbService
{
    private readonly IConfiguration _configuration;

    public ExpenseDbService(
        IConfiguration configuration
    )
    {
        _configuration = configuration;
    }

    private string GetConnectionString()
    {
        var connectionString =
            _configuration.GetConnectionString(
                "DefaultConnection"
            );

        if (
            string.IsNullOrWhiteSpace(
                connectionString
            )
        )
        {
            throw new InvalidOperationException(
                "Missing database connection string."
            );
        }

        return connectionString;
    }

    public async Task<List<TripExpenseResponse>?>
        GetTripExpensesForUserAsync(
            Guid tripId,
            Guid userId
        )
    {
        var expenses =
            new List<TripExpenseResponse>();

        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        const string sql = """
        SELECT
            e.id,
            e.trip_id,
            e.category,
            e.title,
            e.amount,
            e.currency,
            e.reference_url,
            e.notes,
            i.id AS itinerary_item_id,
            i.itinerary_date,
            i.start_time,
            i.end_time,
            e.created_at,
            e.updated_at
        FROM trips t
        LEFT JOIN trip_expenses e
            ON e.trip_id = t.id
        LEFT JOIN trip_itinerary_items i
            ON i.expense_id = e.id
           AND i.trip_id = e.trip_id
        WHERE t.id = @trip_id
          AND t.user_id = @user_id
        ORDER BY e.created_at DESC;
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
            return expenses;
        }

        do
        {
            expenses.Add(
                MapTripExpenseResponse(
                    reader
                )
            );
        }
        while (
            await reader.ReadAsync()
        );

        return expenses;
    }

    public async Task<TripExpense?>
        CreateTripExpenseForUserAsync(
            Guid tripId,
            Guid userId,
            CreateTripExpenseRequest request
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        return await CreateTripExpenseForUserAsync(
            connection,
            transaction: null,
            tripId,
            userId,
            request
        );
    }

    internal async Task<TripExpense?>
        CreateTripExpenseForUserAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid userId,
            CreateTripExpenseRequest request
        )
    {
        const string sql = """
        INSERT INTO trip_expenses (
            trip_id,
            category,
            title,
            amount,
            currency,
            reference_url,
            notes
        )
        SELECT
            t.id,
            @category,
            @title,
            @amount,
            @currency,
            @reference_url,
            @notes
        FROM trips t
        WHERE t.id = @trip_id
          AND t.user_id = @user_id
        RETURNING
            id,
            trip_id,
            category,
            title,
            amount,
            currency,
            reference_url,
            notes,
            created_at,
            updated_at;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
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

        return MapTripExpense(
            reader
        );
    }

    public async Task<TripExpense?>
        UpdateTripExpenseForUserAsync(
            Guid tripId,
            Guid expenseId,
            Guid userId,
            UpdateTripExpenseRequest request
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        return await UpdateTripExpenseForUserAsync(
            connection,
            transaction: null,
            tripId,
            expenseId,
            userId,
            request
        );
    }

    internal async Task<TripExpense?>
        UpdateTripExpenseForUserAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid expenseId,
            Guid userId,
            UpdateTripExpenseRequest request
        )
    {
        const string sql = """
        UPDATE trip_expenses e
        SET
            category = @category,
            title = @title,
            amount = @amount,
            currency = @currency,
            reference_url = @reference_url,
            notes = @notes
        FROM trips t
        WHERE e.id = @expense_id
          AND e.trip_id = @trip_id
          AND t.id = e.trip_id
          AND t.user_id = @user_id
        RETURNING
            e.id,
            e.trip_id,
            e.category,
            e.title,
            e.amount,
            e.currency,
            e.reference_url,
            e.notes,
            e.created_at,
            e.updated_at;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
            );

        command.Parameters.AddWithValue(
            "expense_id",
            expenseId
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

        return MapTripExpense(
            reader
        );
    }

    public async Task<bool>
        DeleteTripExpenseForUserAsync(
            Guid tripId,
            Guid expenseId,
            Guid userId
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        return await DeleteTripExpenseForUserAsync(
            connection,
            transaction: null,
            tripId,
            expenseId,
            userId
        );
    }

    internal async Task<bool>
        DeleteTripExpenseForUserAsync(
            NpgsqlConnection connection,
            NpgsqlTransaction? transaction,
            Guid tripId,
            Guid expenseId,
            Guid userId
        )
    {
        const string sql = """
        DELETE FROM trip_expenses e
        USING trips t
        WHERE e.id = @expense_id
          AND e.trip_id = @trip_id
          AND t.id = e.trip_id
          AND t.user_id = @user_id
        RETURNING e.id;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection,
                transaction
            );

        command.Parameters.AddWithValue(
            "expense_id",
            expenseId
        );

        command.Parameters.AddWithValue(
            "trip_id",
            tripId
        );

        command.Parameters.AddWithValue(
            "user_id",
            userId
        );

        var deletedExpenseId =
            await command.ExecuteScalarAsync();

        return deletedExpenseId is not null;
    }

    private static void AddCommonParameters(
        NpgsqlCommand command,
        Guid tripId,
        Guid userId,
        TripExpenseRequestBase request
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
            "category",
            NormalizeExpenseCategory(
                request.Category
            )
        );

        command.Parameters.AddWithValue(
            "title",
            request.Title.Trim()
        );

        command.Parameters.AddWithValue(
            "amount",
            request.Amount
        );

        command.Parameters.AddWithValue(
            "currency",
            request.Currency
                .Trim()
                .ToUpperInvariant()
        );

        var referenceUrlParameter =
            command.Parameters.Add(
                "reference_url",
                NpgsqlDbType.Text
            );

        referenceUrlParameter.Value =
            string.IsNullOrWhiteSpace(
                request.ReferenceUrl
            )
                ? DBNull.Value
                : request.ReferenceUrl.Trim();

        var notesParameter =
            command.Parameters.Add(
                "notes",
                NpgsqlDbType.Text
            );

        notesParameter.Value =
            string.IsNullOrWhiteSpace(
                request.Notes
            )
                ? DBNull.Value
                : request.Notes.Trim();
    }

    private static TripExpense MapTripExpense(
        NpgsqlDataReader reader
    )
    {
        return new TripExpense
        {
            Id =
                reader.GetGuid(
                    reader.GetOrdinal("id")
                ),

            TripId =
                reader.GetGuid(
                    reader.GetOrdinal("trip_id")
                ),

            Category =
                reader.GetString(
                    reader.GetOrdinal("category")
                ),

            Title =
                reader.GetString(
                    reader.GetOrdinal("title")
                ),

            Amount =
                reader.GetDecimal(
                    reader.GetOrdinal("amount")
                ),

            Currency =
                reader.GetString(
                    reader.GetOrdinal("currency")
                ).Trim(),

            ReferenceUrl =
                reader.IsDBNull(
                    reader.GetOrdinal(
                        "reference_url"
                    )
                )
                    ? null
                    : reader.GetString(
                        reader.GetOrdinal(
                            "reference_url"
                        )
                    ),

            Notes =
                reader.IsDBNull(
                    reader.GetOrdinal("notes")
                )
                    ? null
                    : reader.GetString(
                        reader.GetOrdinal("notes")
                    ),

            CreatedAt =
                reader.GetDateTime(
                    reader.GetOrdinal(
                        "created_at"
                    )
                ),

            UpdatedAt =
                reader.GetDateTime(
                    reader.GetOrdinal(
                        "updated_at"
                    )
                )
        };
    }

    private static TripExpenseResponse
        MapTripExpenseResponse(
            NpgsqlDataReader reader
        )
    {
        return new TripExpenseResponse
        {
            Id =
                reader.GetGuid(
                    reader.GetOrdinal("id")
                ),

            TripId =
                reader.GetGuid(
                    reader.GetOrdinal("trip_id")
                ),

            Category =
                reader.GetString(
                    reader.GetOrdinal("category")
                ),

            Title =
                reader.GetString(
                    reader.GetOrdinal("title")
                ),

            Amount =
                reader.GetDecimal(
                    reader.GetOrdinal("amount")
                ),

            Currency =
                reader.GetString(
                    reader.GetOrdinal("currency")
                ).Trim(),

            ReferenceUrl =
                reader.IsDBNull(
                    reader.GetOrdinal(
                        "reference_url"
                    )
                )
                    ? null
                    : reader.GetString(
                        reader.GetOrdinal(
                            "reference_url"
                        )
                    ),

            Notes =
                reader.IsDBNull(
                    reader.GetOrdinal("notes")
                )
                    ? null
                    : reader.GetString(
                        reader.GetOrdinal("notes")
                    ),

            ItineraryItemId =
                reader.IsDBNull(
                    reader.GetOrdinal(
                        "itinerary_item_id"
                    )
                )
                    ? null
                    : reader.GetGuid(
                        reader.GetOrdinal(
                            "itinerary_item_id"
                        )
                    ),

            ItineraryDate =
                reader.IsDBNull(
                    reader.GetOrdinal(
                        "itinerary_date"
                    )
                )
                    ? null
                    : reader.GetFieldValue<DateOnly>(
                        reader.GetOrdinal(
                            "itinerary_date"
                        )
                    ),

            StartTime =
                reader.IsDBNull(
                    reader.GetOrdinal(
                        "start_time"
                    )
                )
                    ? null
                    : reader.GetFieldValue<TimeOnly>(
                        reader.GetOrdinal(
                            "start_time"
                        )
                    ),

            EndTime =
                reader.IsDBNull(
                    reader.GetOrdinal(
                        "end_time"
                    )
                )
                    ? null
                    : reader.GetFieldValue<TimeOnly>(
                        reader.GetOrdinal(
                            "end_time"
                        )
                    ),

            CreatedAt =
                reader.GetDateTime(
                    reader.GetOrdinal(
                        "created_at"
                    )
                ),

            UpdatedAt =
                reader.GetDateTime(
                    reader.GetOrdinal(
                        "updated_at"
                    )
                )
        };
    }

    private static string NormalizeExpenseCategory(
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
                item =>
                    string.Equals(
                        item,
                        normalizedCategory,
                        StringComparison.OrdinalIgnoreCase
                    )
            );

        return builtInCategory
            ?? normalizedCategory;
    }

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
}