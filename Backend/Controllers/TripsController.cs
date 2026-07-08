using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TripsController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public TripsController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetTrips()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return Problem("Missing database connection string.");
        }

        var trips = new List<Trip>();

        await using var connection = new NpgsqlConnection(connectionString);
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
            var trip = new Trip
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

            trips.Add(trip);
        }

        return Ok(trips);
    }
}