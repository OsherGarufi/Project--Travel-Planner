using Backend.DAL;
using Backend.Dtos;
using Backend.Models;
using Npgsql;

namespace Backend.Services;

public class TripService
{
    private readonly IConfiguration _configuration;
    private readonly DbService _dbService;
    private readonly ItineraryDbService _itineraryDbService;

    public TripService(
        IConfiguration configuration,
        DbService dbService,
        ItineraryDbService itineraryDbService
    )
    {
        _configuration = configuration;
        _dbService = dbService;
        _itineraryDbService = itineraryDbService;
    }

    /// <summary>
    /// Updates a trip and moves only itinerary activities that
    /// fall outside the new trip date range to Global Unscheduled.
    ///
    /// Activities that remain inside the new range are left
    /// completely unchanged.
    ///
    /// Both operations run inside the same database transaction.
    /// </summary>
    public async Task<Trip?>
        UpdateTripAsync(
            Guid tripId,
            Guid userId,
            UpdateTripRequest request
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            var updatedTrip =
                await _dbService
                    .UpdateTripForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        userId,
                        request
                    );

            if (updatedTrip is null)
            {
                await transaction.RollbackAsync();

                return null;
            }

            await _itineraryDbService
                .MoveOutOfRangeItemsToGlobalUnscheduledAsync(
                    connection,
                    transaction,
                    tripId,
                    userId,
                    request.StartDate,
                    request.EndDate
                );

            await transaction.CommitAsync();

            return updatedTrip;
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    /// <summary>
    /// Reads the database connection string used for the
    /// transactional trip update flow.
    /// </summary>
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
}