using Backend.Dtos;
using Backend.Models;
using Npgsql;
using Backend.Dtos.Expenses;

namespace Backend.DAL;

public class DbService
{
    private readonly IConfiguration _configuration;

    public DbService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>Reads the database connection string from configuration.</summary>
    private string GetConnectionString()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Missing database connection string.");
        }

        return connectionString;
    }

    /// <summary>Returns all trips that belong to a specific user.</summary>
    public async Task<List<Trip>> GetTripsByUserIdAsync(Guid userId)
    {
        var trips = new List<Trip>();

        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        const string sql = """
        SELECT
            id,
            user_id,
            title,
            destination_country_code,
            destination_country_name,
            destination_city,
            start_date,
            end_date,
            budget_amount,
            budget_currency,
            notes,
            created_at,
            updated_at
        FROM trips
        WHERE user_id = @user_id
        ORDER BY created_at DESC;
        """;

        await using var command = new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue("user_id", userId);

        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            trips.Add(MapTrip(reader));
        }

        return trips;
    }

    /// <summary>Returns a single trip by id only if it belongs to the specified user.</summary>
    public async Task<Trip?> GetTripByIdForUserAsync(Guid id, Guid userId)
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        const string sql = """
        SELECT
            id,
            user_id,
            title,
            destination_country_code,
            destination_country_name,
            destination_city,
            start_date,
            end_date,
            budget_amount,
            budget_currency,
            notes,
            created_at,
            updated_at
        FROM trips
        WHERE id = @id
        AND user_id = @user_id
        LIMIT 1;
        """;

        await using var command = new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("user_id", userId);

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTrip(reader);
    }

    /// <summary>Creates a new trip in the database and returns the created trip.</summary>
    public async Task<Trip> CreateTripAsync(CreateTripRequest request, Guid userId)
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        const string sql = """
        INSERT INTO trips (
            user_id,
            title,
            destination_country_code,
            destination_country_name,
            destination_city,
            start_date,
            end_date,
            budget_amount,
            budget_currency,
            notes
        )
        VALUES (
            @user_id,
            @title,
            @destination_country_code,
            @destination_country_name,
            @destination_city,
            @start_date,
            @end_date,
            @budget_amount,
            @budget_currency,
            @notes
        )
        RETURNING
            id,
            user_id,
            title,
            destination_country_code,
            destination_country_name,
            destination_city,
            start_date,
            end_date,
            budget_amount,
            budget_currency,
            notes,
            created_at,
            updated_at;
        """;

        await using var command = new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue("user_id", userId);
        command.Parameters.AddWithValue("title", request.Title);
        command.Parameters.AddWithValue(
            "destination_country_code",
            request.DestinationCountryCode.ToUpper()
        );
        command.Parameters.AddWithValue(
            "destination_country_name",
            request.DestinationCountryName
        );
        command.Parameters.AddWithValue("destination_city", request.DestinationCity);
        command.Parameters.AddWithValue("start_date", request.StartDate);
        command.Parameters.AddWithValue("end_date", request.EndDate);

        command.Parameters.AddWithValue(
            "budget_amount",
            request.BudgetAmount.HasValue
                ? request.BudgetAmount.Value
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "budget_currency",
            request.BudgetCurrency.ToUpper()
        );

        command.Parameters.AddWithValue(
            "notes",
            string.IsNullOrWhiteSpace(request.Notes)
                ? DBNull.Value
                : request.Notes
        );

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            throw new InvalidOperationException("Failed to create trip.");
        }

        return MapTrip(reader);
    }

    /// <summary>Updates a trip only if it belongs to the specified user.</summary>
    public async Task<Trip?> UpdateTripForUserAsync(Guid id,Guid userId,UpdateTripRequest request)
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        const string sql = """
        UPDATE trips
        SET
            title = @title,
            destination_country_code = @destination_country_code,
            destination_country_name = @destination_country_name,
            destination_city = @destination_city,
            start_date = @start_date,
            end_date = @end_date,
            budget_amount = @budget_amount,
            budget_currency = @budget_currency,
            notes = @notes
        WHERE id = @id
        AND user_id = @user_id
        RETURNING
            id,
            user_id,
            title,
            destination_country_code,
            destination_country_name,
            destination_city,
            start_date,
            end_date,
            budget_amount,
            budget_currency,
            notes,
            created_at,
            updated_at;
        """;

        await using var command = new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("user_id", userId);
        command.Parameters.AddWithValue("title", request.Title);
        command.Parameters.AddWithValue(
            "destination_country_code",
            request.DestinationCountryCode.ToUpper()
        );
        command.Parameters.AddWithValue(
            "destination_country_name",
            request.DestinationCountryName
        );
        command.Parameters.AddWithValue("destination_city", request.DestinationCity);
        command.Parameters.AddWithValue("start_date", request.StartDate);
        command.Parameters.AddWithValue("end_date", request.EndDate);

        command.Parameters.AddWithValue(
            "budget_amount",
            request.BudgetAmount.HasValue
                ? request.BudgetAmount.Value
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "budget_currency",
            request.BudgetCurrency.ToUpper()
        );

        command.Parameters.AddWithValue(
            "notes",
            string.IsNullOrWhiteSpace(request.Notes)
                ? DBNull.Value
                : request.Notes
        );

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTrip(reader);
    }

    /// <summary>Deletes a trip only if it belongs to the specified user.</summary>
    public async Task<bool> DeleteTripForUserAsync(Guid id, Guid userId)
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        const string sql = """
        DELETE FROM trips
        WHERE id = @id
        AND user_id = @user_id;
        """;

        await using var command = new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("user_id", userId);

        var affectedRows = await command.ExecuteNonQueryAsync();

        return affectedRows > 0;
    }

    /// <summary>
    /// Returns all expenses for a trip only if the trip belongs to the specified user.
    /// Returns null when the trip does not exist or does not belong to the user.
    /// </summary>
    public async Task<List<TripExpense>?> GetTripExpensesForUserAsync(
        Guid tripId,
        Guid userId
    )
    {
        var expenses = new List<TripExpense>();

        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

        const string sql = """
    SELECT
        e.id,
        e.trip_id,
        e.category,
        e.title,
        e.amount,
        e.currency,
        e.expense_date,
        e.reference_url,
        e.notes,
        e.created_at,
        e.updated_at
    FROM trips t
    LEFT JOIN trip_expenses e
        ON e.trip_id = t.id
    WHERE t.id = @trip_id
      AND t.user_id = @user_id
    ORDER BY e.created_at DESC;
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
            return expenses;
        }

        do
        {
            expenses.Add(MapTripExpense(reader));
        }
        while (await reader.ReadAsync());

        return expenses;
    }


    /// <summary>
    /// Creates an expense for a trip only if the trip belongs
    /// to the specified user.
    /// Returns null when the trip does not exist or does not
    /// belong to the user.
    /// </summary>
    public async Task<TripExpense?> CreateTripExpenseForUserAsync(
        Guid tripId,
        Guid userId,
        CreateTripExpenseRequest request
    )
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

        const string sql = """
    INSERT INTO trip_expenses (
        trip_id,
        category,
        title,
        amount,
        currency,
        expense_date,
        reference_url,
        notes
    )
    SELECT
        t.id,
        @category,
        @title,
        @amount,
        @currency,
        @expense_date,
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
        expense_date,
        reference_url,
        notes,
        created_at,
        updated_at;
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

        command.Parameters.AddWithValue(
            "category",
            NormalizeExpenseCategory(request.Category)
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
            request.Currency.Trim().ToUpperInvariant()
        );

        command.Parameters.AddWithValue(
            "expense_date",
            request.ExpenseDate.HasValue
                ? request.ExpenseDate.Value
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "reference_url",
            string.IsNullOrWhiteSpace(request.ReferenceUrl)
                ? DBNull.Value
                : request.ReferenceUrl.Trim()
        );

        command.Parameters.AddWithValue(
            "notes",
            string.IsNullOrWhiteSpace(request.Notes)
                ? DBNull.Value
                : request.Notes.Trim()
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTripExpense(reader);
    }


    /// <summary>
    /// Updates an expense only if both the expense and trip
    /// belong to the specified user.
    /// Returns null when the trip or expense does not exist,
    /// or when the trip does not belong to the user.
    /// </summary>
    public async Task<TripExpense?> UpdateTripExpenseForUserAsync(
        Guid tripId,
        Guid expenseId,
        Guid userId,
        UpdateTripExpenseRequest request
    )
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

        const string sql = """
    UPDATE trip_expenses e
    SET
        category = @category,
        title = @title,
        amount = @amount,
        currency = @currency,
        expense_date = @expense_date,
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
        e.expense_date,
        e.reference_url,
        e.notes,
        e.created_at,
        e.updated_at;
    """;

        await using var command =
            new NpgsqlCommand(sql, connection);

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

        command.Parameters.AddWithValue(
            "category",
            NormalizeExpenseCategory(request.Category)
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
            request.Currency.Trim().ToUpperInvariant()
        );

        command.Parameters.AddWithValue(
            "expense_date",
            request.ExpenseDate.HasValue
                ? request.ExpenseDate.Value
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "reference_url",
            string.IsNullOrWhiteSpace(request.ReferenceUrl)
                ? DBNull.Value
                : request.ReferenceUrl.Trim()
        );

        command.Parameters.AddWithValue(
            "notes",
            string.IsNullOrWhiteSpace(request.Notes)
                ? DBNull.Value
                : request.Notes.Trim()
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTripExpense(reader);
    }

    /// <summary>
    /// Deletes an expense only if it belongs to the specified trip
    /// and the trip belongs to the specified user.
    /// Returns false when the trip or expense does not exist,
    /// or when the trip does not belong to the user.
    /// </summary>
    public async Task<bool> DeleteTripExpenseForUserAsync(
        Guid tripId,
        Guid expenseId,
        Guid userId
    )
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

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
            new NpgsqlCommand(sql, connection);

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

    /// <summary>Creates a user if it does not exist, or updates it if it already exists.</summary>
    public async Task<AppUser> UpsertUserAsync(UpsertUserRequest request)
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        const string sql = """
        INSERT INTO users (
            firebase_uid,
            email,
            display_name,
            photo_url
        )
        VALUES (
            @firebase_uid,
            @email,
            @display_name,
            @photo_url
        )
        ON CONFLICT (firebase_uid)
        DO UPDATE SET
            email = EXCLUDED.email,
            display_name = EXCLUDED.display_name,
            photo_url = EXCLUDED.photo_url
        RETURNING
            id,
            firebase_uid,
            email,
            display_name,
            photo_url,
            created_at,
            updated_at;
        """;

        await using var command = new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue("firebase_uid", request.FirebaseUid);
        command.Parameters.AddWithValue("email", request.Email);

        command.Parameters.AddWithValue(
            "display_name",
            string.IsNullOrWhiteSpace(request.DisplayName)
                ? DBNull.Value
                : request.DisplayName
        );

        command.Parameters.AddWithValue(
            "photo_url",
            string.IsNullOrWhiteSpace(request.PhotoUrl)
                ? DBNull.Value
                : request.PhotoUrl
        );

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            throw new InvalidOperationException("Failed to create or update user.");
        }

        return MapUser(reader);
    }

    /// <summary>Returns a user by Firebase UID, or null if the user does not exist.</summary>
    public async Task<AppUser?> GetUserByFirebaseUidAsync(string firebaseUid)
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        const string sql = """
        SELECT
            id,
            firebase_uid,
            email,
            display_name,
            photo_url,
            created_at,
            updated_at
        FROM users
        WHERE firebase_uid = @firebase_uid
        LIMIT 1;
        """;

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("firebase_uid", firebaseUid);

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapUser(reader);
    }

    /// <summary>Maps a database row into an AppUser model object.</summary>
    private static AppUser MapUser(NpgsqlDataReader reader)
    {
        return new AppUser
        {
            Id = reader.GetGuid(reader.GetOrdinal("id")),
            FirebaseUid = reader.GetString(reader.GetOrdinal("firebase_uid")),
            Email = reader.GetString(reader.GetOrdinal("email")),

            DisplayName = reader.IsDBNull(reader.GetOrdinal("display_name"))
                ? null
                : reader.GetString(reader.GetOrdinal("display_name")),

            PhotoUrl = reader.IsDBNull(reader.GetOrdinal("photo_url"))
                ? null
                : reader.GetString(reader.GetOrdinal("photo_url")),

            CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt = reader.GetDateTime(reader.GetOrdinal("updated_at"))
        };
    }

    /// <summary>Maps a database row into a TripExpense model object.</summary>
    private static TripExpense MapTripExpense(
        NpgsqlDataReader reader
    )
    {
        return new TripExpense
        {
            Id = reader.GetGuid(
                reader.GetOrdinal("id")
            ),

            TripId = reader.GetGuid(
                reader.GetOrdinal("trip_id")
            ),

            Category = reader.GetString(
                reader.GetOrdinal("category")
            ),

            Title = reader.GetString(
                reader.GetOrdinal("title")
            ),

            Amount = reader.GetDecimal(
                reader.GetOrdinal("amount")
            ),

            Currency = reader.GetString(
                reader.GetOrdinal("currency")
            ).Trim(),

            ExpenseDate = reader.IsDBNull(
                reader.GetOrdinal("expense_date")
            )
                ? null
                : reader.GetFieldValue<DateOnly>(
                    reader.GetOrdinal("expense_date")
                ),

            ReferenceUrl = reader.IsDBNull(
                reader.GetOrdinal("reference_url")
            )
                ? null
                : reader.GetString(
                    reader.GetOrdinal("reference_url")
                ),

            Notes = reader.IsDBNull(
                reader.GetOrdinal("notes")
            )
                ? null
                : reader.GetString(
                    reader.GetOrdinal("notes")
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
    /// Normalizes an expense category while preserving custom
    /// category capitalization.
    /// </summary>
    private static string NormalizeExpenseCategory(
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

    /// <summary>Maps a database row into a Trip model object.</summary>
    private static Trip MapTrip(NpgsqlDataReader reader)
    {
        return new Trip
        {
            Id = reader.GetGuid(reader.GetOrdinal("id")),
            UserId = reader.GetGuid(reader.GetOrdinal("user_id")),

            Title = reader.GetString(reader.GetOrdinal("title")),

            DestinationCountryCode = reader.GetString(reader.GetOrdinal("destination_country_code")).Trim(),
            DestinationCountryName = reader.GetString(reader.GetOrdinal("destination_country_name")),
            DestinationCity = reader.GetString(reader.GetOrdinal("destination_city")),

            StartDate = reader.GetFieldValue<DateOnly>(reader.GetOrdinal("start_date")),
            EndDate = reader.GetFieldValue<DateOnly>(reader.GetOrdinal("end_date")),

            BudgetAmount = reader.IsDBNull(reader.GetOrdinal("budget_amount"))
                ? null
                : reader.GetDecimal(reader.GetOrdinal("budget_amount")),

            BudgetCurrency = reader.GetString(reader.GetOrdinal("budget_currency")).Trim(),

            Notes = reader.IsDBNull(reader.GetOrdinal("notes"))
                ? null
                : reader.GetString(reader.GetOrdinal("notes")),

            CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at")),
            UpdatedAt = reader.GetDateTime(reader.GetOrdinal("updated_at"))
        };
    }
}