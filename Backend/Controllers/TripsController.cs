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
    private readonly FirebaseAuthService _firebaseAuthService;

    public TripsController(
        DbService dbService,
        FirebaseAuthService firebaseAuthService
    )
    {
        _dbService = dbService;
        _firebaseAuthService = firebaseAuthService;
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
    public async Task<IActionResult> CreateTrip(
        [FromBody] CreateTripRequest request,
        [FromHeader(Name = "Authorization")] string? authorizationHeader
    )
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            return Unauthorized("Missing Authorization header.");
        }

        if (!authorizationHeader.StartsWith("Bearer "))
        {
            return Unauthorized("Invalid Authorization header format.");
        }

        var idToken = authorizationHeader["Bearer ".Length..];

        try
        {
            var firebaseToken =
                await _firebaseAuthService.VerifyIdTokenAsync(idToken);

            var user =
                await _dbService.GetUserByFirebaseUidAsync(firebaseToken.Uid);

            if (user is null)
            {
                return Unauthorized(
                    "User was not found in the database. Please login first."
                );
            }

            var createdTrip =
                await _dbService.CreateTripAsync(request, user.Id);

            return Created($"/api/trips/{createdTrip.Id}", createdTrip);
        }
        catch
        {
            return Unauthorized("Invalid Firebase ID token.");
        }
    }

    /// <summary>Updates an existing trip by its id.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTrip(
        Guid id,
        [FromBody] UpdateTripRequest request
    )
    {
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