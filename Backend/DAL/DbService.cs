using Backend.Dtos;
using Backend.Models;
using Npgsql;

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

    /// <summary>Returns all trips from the database, ordered by newest first.</summary>
    public async Task<List<Trip>> GetTripsAsync()
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
            ORDER BY created_at DESC;
            """;

        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            trips.Add(MapTrip(reader));
        }

        return trips;
    }

    /// <summary>Returns a single trip by id, or null if it does not exist.</summary>
    public async Task<Trip?> GetTripByIdAsync(Guid id)
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
        LIMIT 1;
        """;

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", id);

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

    /// <summary>Updates an existing trip in the database and returns the updated trip, or null if it does not exist.</summary>
    public async Task<Trip?> UpdateTripAsync(Guid id, UpdateTripRequest request)
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
        command.Parameters.AddWithValue("title", request.Title);
        command.Parameters.AddWithValue("destination_country_code", request.DestinationCountryCode.ToUpper());
        command.Parameters.AddWithValue("destination_country_name", request.DestinationCountryName);
        command.Parameters.AddWithValue("destination_city", request.DestinationCity);
        command.Parameters.AddWithValue("start_date", request.StartDate);
        command.Parameters.AddWithValue("end_date", request.EndDate);

        command.Parameters.AddWithValue(
            "budget_amount",
            request.BudgetAmount.HasValue ? request.BudgetAmount.Value : DBNull.Value
        );

        command.Parameters.AddWithValue("budget_currency", request.BudgetCurrency.ToUpper());

        command.Parameters.AddWithValue(
            "notes",
            string.IsNullOrWhiteSpace(request.Notes) ? DBNull.Value : request.Notes
        );

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapTrip(reader);
    }

    /// <summary>Deletes a trip by id and returns true if a trip was deleted.</summary>
    public async Task<bool> DeleteTripAsync(Guid id)
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        const string sql = """
        DELETE FROM trips
        WHERE id = @id;
        """;

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", id);

        var affectedRows = await command.ExecuteNonQueryAsync();

        return affectedRows > 0;
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