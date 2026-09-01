using Backend.DAL;
using Backend.Dtos;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TripsController : ControllerBase
{
    private readonly DbService _dbService;
    private readonly TripService _tripService;
    private readonly CurrentUserService _currentUserService;

    public TripsController(
        DbService dbService,
        TripService tripService,
        CurrentUserService currentUserService
    )
    {
        _dbService = dbService;
        _tripService = tripService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTrips()
    {
        var user =
            await _currentUserService
                .GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(
                "Invalid or missing Firebase ID token."
            );
        }

        var trips =
            await _dbService
                .GetTripsByUserIdAsync(
                    user.Id
                );

        return Ok(trips);
    }

    /// <summary>
    /// Returns a single trip by its id only if it belongs to
    /// the authenticated user.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTripById(
        Guid id
    )
    {
        var user =
            await _currentUserService
                .GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(
                "Invalid or missing Firebase ID token."
            );
        }

        var trip =
            await _dbService
                .GetTripByIdForUserAsync(
                    id,
                    user.Id
                );

        if (trip is null)
        {
            return NotFound(
                $"Trip with id '{id}' was not found."
            );
        }

        return Ok(trip);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTrip(
        [FromBody] CreateTripRequest request
    )
    {
        var user =
            await _currentUserService
                .GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(
                "Invalid or missing Firebase ID token."
            );
        }

        var createdTrip =
            await _dbService
                .CreateTripAsync(
                    request,
                    user.Id
                );

        return Created(
            $"/api/trips/{createdTrip.Id}",
            createdTrip
        );
    }

    /// <summary>
    /// Updates an existing trip.
    ///
    /// Itinerary activities that remain inside the new trip
    /// date range are left unchanged.
    ///
    /// Only activities outside the new range are moved to
    /// Global Unscheduled.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTrip(
        Guid id,
        [FromBody] UpdateTripRequest request
    )
    {
        var user =
            await _currentUserService
                .GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(
                "Invalid or missing Firebase ID token."
            );
        }

        var updatedTrip =
            await _tripService
                .UpdateTripAsync(
                    id,
                    user.Id,
                    request
                );

        if (updatedTrip is null)
        {
            return NotFound(
                $"Trip with id '{id}' was not found."
            );
        }

        return Ok(updatedTrip);
    }

    /// <summary>
    /// Deletes an existing trip only if it belongs to the
    /// authenticated user.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTrip(
        Guid id
    )
    {
        var user =
            await _currentUserService
                .GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(
                "Invalid or missing Firebase ID token."
            );
        }

        var wasDeleted =
            await _dbService
                .DeleteTripForUserAsync(
                    id,
                    user.Id
                );

        if (!wasDeleted)
        {
            return NotFound(
                $"Trip with id '{id}' was not found."
            );
        }

        return NoContent();
    }
}