using Backend.DAL;
using Backend.Dtos.Itinerary;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/Trips/{tripId:guid}/itinerary")]
public class ItineraryController : ControllerBase
{
    private readonly ItineraryDbService _itineraryDbService;
    private readonly ItineraryExpenseService _itineraryExpenseService;
    private readonly DbService _dbService;
    private readonly CurrentUserService _currentUserService;

    public ItineraryController(
        ItineraryDbService itineraryDbService,
        ItineraryExpenseService itineraryExpenseService,
        DbService dbService,
        CurrentUserService currentUserService
    )
    {
        _itineraryDbService = itineraryDbService;
        _itineraryExpenseService = itineraryExpenseService;
        _dbService = dbService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Returns all itinerary items for a trip only if the trip
    /// belongs to the authenticated user.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTripItinerary(
        Guid tripId
    )
    {
        var user =
            await _currentUserService.GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(
                "Invalid or missing Firebase ID token."
            );
        }

        var items =
            await _itineraryDbService
                .GetTripItineraryForUserAsync(
                    tripId,
                    user.Id
                );

        if (items is null)
        {
            return NotFound(
                $"Trip with id '{tripId}' was not found."
            );
        }

        return Ok(items);
    }

    /// <summary>
    /// Creates a new itinerary item.
    ///
    /// Free activities are stored only in the itinerary.
    /// Activities with a positive cost also create and link
    /// an expense inside the same database transaction.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTripItineraryItem(
        Guid tripId,
        [FromBody] CreateTripItineraryItemRequest request
    )
    {
        var user =
            await _currentUserService.GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(
                "Invalid or missing Firebase ID token."
            );
        }

        var trip =
            await _dbService.GetTripByIdForUserAsync(
                tripId,
                user.Id
            );

        if (trip is null)
        {
            return NotFound(
                $"Trip with id '{tripId}' was not found."
            );
        }

        if (
            request.ItineraryDate.HasValue &&
            (
                request.ItineraryDate.Value <
                    trip.StartDate ||
                request.ItineraryDate.Value >
                    trip.EndDate
            )
        )
        {
            return BadRequest(
                "Itinerary date must be within the trip date range."
            );
        }

        var createdItem =
            await _itineraryExpenseService
                .CreateItineraryItemAsync(
                    tripId,
                    user.Id,
                    request
                );

        if (createdItem is null)
        {
            return NotFound(
                $"Trip with id '{tripId}' was not found."
            );
        }

        return Created(
            $"/api/Trips/{tripId}/itinerary/{createdItem.Id}",
            createdItem
        );
    }

    /// <summary>
    /// Updates an itinerary item only if it belongs to the
    /// specified trip and the trip belongs to the
    /// authenticated user.
    ///
    /// Expense synchronization will be handled by the business
    /// service in the next implementation stage.
    /// </summary>
    [HttpPut("{itemId:guid}")]
    public async Task<IActionResult> UpdateTripItineraryItem(
        Guid tripId,
        Guid itemId,
        [FromBody] UpdateTripItineraryItemRequest request
    )
    {
        var user =
            await _currentUserService.GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(
                "Invalid or missing Firebase ID token."
            );
        }

        var trip =
            await _dbService.GetTripByIdForUserAsync(
                tripId,
                user.Id
            );

        if (trip is null)
        {
            return NotFound(
                $"Trip with id '{tripId}' was not found."
            );
        }

        if (
            request.ItineraryDate.HasValue &&
            (
                request.ItineraryDate.Value <
                    trip.StartDate ||
                request.ItineraryDate.Value >
                    trip.EndDate
            )
        )
        {
            return BadRequest(
                "Itinerary date must be within the trip date range."
            );
        }

        var updatedItem =
            await _itineraryExpenseService
                .UpdateItineraryItemAsync(
                    tripId,
                    itemId,
                    user.Id,
                    request
                );

        if (updatedItem is null)
        {
            return NotFound(
                $"Itinerary item with id '{itemId}' was not found for trip '{tripId}'."
            );
        }

        return Ok(updatedItem);
    }

    /// <summary>
    /// Deletes an itinerary activity.
    ///
    /// Free activity:
    /// - deletes only the itinerary item.
    ///
    /// Paid activity:
    /// - deletes both the itinerary item and its linked expense
    ///   inside the same database transaction.
    /// </summary>
    [HttpDelete("{itemId:guid}")]
    public async Task<IActionResult> DeleteTripItineraryItem(
        Guid tripId,
        Guid itemId
    )
    {
        var user =
            await _currentUserService.GetCurrentUserAsync();

        if (user is null)
        {
            return Unauthorized(
                "Invalid or missing Firebase ID token."
            );
        }

        var wasDeleted =
            await _itineraryExpenseService
                .DeleteItineraryItemAsync(
                    tripId,
                    itemId,
                    user.Id
                );

        if (!wasDeleted)
        {
            return NotFound(
                $"Itinerary item with id '{itemId}' was not found for trip '{tripId}'."
            );
        }

        return NoContent();
    }
}