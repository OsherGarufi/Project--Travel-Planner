using Backend.DAL;
using Backend.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TripsController : ControllerBase
{
    private readonly DbService _dbService;

    public TripsController(DbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTrips()
    {
        var trips = await _dbService.GetTripsAsync();

        return Ok(trips);
    }

    /// <summary>Returns a single trip by its id.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTripById(Guid id)
    {
        var trip = await _dbService.GetTripByIdAsync(id);

        if (trip is null)
        {
            return NotFound($"Trip with id '{id}' was not found.");
        }

        return Ok(trip);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTrip(CreateTripRequest request)
    {
        if (request.EndDate < request.StartDate)
        {
            return BadRequest("End date cannot be before start date.");
        }

        if (request.BudgetAmount < 0)
        {
            return BadRequest("Budget amount cannot be negative.");
        }

        var createdTrip = await _dbService.CreateTripAsync(request);

        return Created($"/api/trips/{createdTrip.Id}", createdTrip);
    }

    /// <summary>Updates an existing trip by its id.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTrip(Guid id, UpdateTripRequest request)
    {
        if (request.EndDate < request.StartDate)
        {
            return BadRequest("End date cannot be before start date.");
        }

        if (request.BudgetAmount < 0)
        {
            return BadRequest("Budget amount cannot be negative.");
        }

        var updatedTrip = await _dbService.UpdateTripAsync(id, request);

        if (updatedTrip is null)
        {
            return NotFound($"Trip with id '{id}' was not found.");
        }

        return Ok(updatedTrip);
    }

    /// <summary>Deletes an existing trip by its id.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTrip(Guid id)
    {
        var wasDeleted = await _dbService.DeleteTripAsync(id);

        if (!wasDeleted)
        {
            return NotFound($"Trip with id '{id}' was not found.");
        }

        return NoContent();
    }
}