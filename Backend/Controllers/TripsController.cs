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
}