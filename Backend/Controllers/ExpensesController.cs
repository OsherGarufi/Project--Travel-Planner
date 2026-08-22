using Backend.DAL;
using Backend.Dtos.Expenses;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/Trips/{tripId:guid}/expenses")]
public class ExpensesController : ControllerBase
{
    private readonly DbService _dbService;
    private readonly CurrentUserService _currentUserService;

    public ExpensesController(
        DbService dbService,
        CurrentUserService currentUserService
    )
    {
        _dbService = dbService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Returns all expenses for a trip only if the trip
    /// belongs to the authenticated user.
    /// </summary>
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
            await _dbService.GetTripExpensesForUserAsync(
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
    /// Creates a new expense for a trip only if the trip
    /// belongs to the authenticated user.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTripExpense(
        Guid tripId,
        [FromBody] CreateTripExpenseRequest request
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

        var createdExpense =
            await _dbService.CreateTripExpenseForUserAsync(
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

    /// <summary>
    /// Updates an existing expense only if the expense belongs
    /// to the specified trip and the trip belongs to the
    /// authenticated user.
    /// </summary>
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
            await _dbService.UpdateTripExpenseForUserAsync(
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
    /// Deletes an existing expense only if the expense belongs
    /// to the specified trip and the trip belongs to the
    /// authenticated user.
    /// </summary>
    [HttpDelete("{expenseId:guid}")]
    public async Task<IActionResult> DeleteTripExpense(
        Guid tripId,
        Guid expenseId
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
            await _dbService.DeleteTripExpenseForUserAsync(
                tripId,
                expenseId,
                user.Id
            );

        if (!wasDeleted)
        {
            return NotFound(
                $"Expense with id '{expenseId}' was not found for trip '{tripId}'."
            );
        }

        return NoContent();
    }
}