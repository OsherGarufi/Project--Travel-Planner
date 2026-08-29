using Backend.DAL;
using Backend.Dtos.Expenses;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/Trips/{tripId:guid}/expenses")]
public class ExpensesController : ControllerBase
{
    private readonly ExpenseDbService _expenseDbService;
    private readonly ItineraryExpenseService _itineraryExpenseService;
    private readonly DbService _dbService;
    private readonly CurrentUserService _currentUserService;

    public ExpensesController(
        ExpenseDbService expenseDbService,
        ItineraryExpenseService itineraryExpenseService,
        DbService dbService,
        CurrentUserService currentUserService
    )
    {
        _expenseDbService = expenseDbService;
        _itineraryExpenseService = itineraryExpenseService;
        _dbService = dbService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTripExpenses(
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

        var expenses =
            await _expenseDbService
                .GetTripExpensesForUserAsync(
                    tripId,
                    user.Id
                );

        if (expenses is null)
        {
            return NotFound(
                $"Trip with id '{tripId}' was not found."
            );
        }

        return Ok(expenses);
    }

    /// <summary>
    /// Creates an expense.
    ///
    /// When itinerary is null, creates a standalone expense.
    ///
    /// When itinerary is supplied, creates the expense and
    /// linked itinerary activity atomically.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTripExpense(
        Guid tripId,
        [FromBody] CreateTripExpenseWithItineraryRequest request
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

        if (request.Itinerary is not null)
        {
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

            var itineraryDate =
                request.Itinerary.ItineraryDate;

            if (
                itineraryDate.HasValue &&
                (
                    itineraryDate.Value < trip.StartDate ||
                    itineraryDate.Value > trip.EndDate
                )
            )
            {
                return BadRequest(
                    "Itinerary date must be within the trip date range."
                );
            }
        }

        var createdExpense =
            await _itineraryExpenseService
                .CreateExpenseAsync(
                    tripId,
                    user.Id,
                    request
                );

        if (createdExpense is null)
        {
            return NotFound(
                $"Trip with id '{tripId}' was not found."
            );
        }

        return Created(
            $"/api/Trips/{tripId}/expenses/{createdExpense.Id}",
            createdExpense
        );
    }

    [HttpPut("{expenseId:guid}")]
    public async Task<IActionResult> UpdateTripExpense(
        Guid tripId,
        Guid expenseId,
        [FromBody] UpdateTripExpenseRequest request
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

        var updatedExpense =
            await _itineraryExpenseService
                .UpdateExpenseAsync(
                    tripId,
                    expenseId,
                    user.Id,
                    request
                );

        if (updatedExpense is null)
        {
            return NotFound(
                $"Expense with id '{expenseId}' was not found for trip '{tripId}'."
            );
        }

        return Ok(updatedExpense);
    }

    /// <summary>
    /// Deletes an expense.
    ///
    /// Unlinked expenses are deleted normally.
    ///
    /// For a linked expense:
    /// - null  -> requires an explicit decision
    /// - false -> delete expense only and keep activity
    /// - true  -> delete both expense and activity
    /// </summary>
    [HttpDelete("{expenseId:guid}")]
    public async Task<IActionResult> DeleteTripExpense(
        Guid tripId,
        Guid expenseId,
        [FromQuery] bool? deleteLinkedActivity = null
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

        var result =
            await _itineraryExpenseService
                .DeleteExpenseAsync(
                    tripId,
                    expenseId,
                    user.Id,
                    deleteLinkedActivity
                );

        return result switch
        {
            ExpenseDeleteResult.Deleted =>
                NoContent(),

            ExpenseDeleteResult.NotFound =>
                NotFound(
                    $"Expense with id '{expenseId}' was not found for trip '{tripId}'."
                ),

            ExpenseDeleteResult.LinkedActivityChoiceRequired =>
                Conflict(
                    new
                    {
                        code =
                            "linked_activity_choice_required",

                        message =
                            "This expense is linked to an itinerary activity. Choose whether to keep or delete the linked activity."
                    }
                ),

            _ =>
                StatusCode(
                    StatusCodes.Status500InternalServerError
                )
        };
    }
}