using Backend.DAL;
using Backend.Dtos;
using Backend.Models;
using Backend.Services;
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TripsController : ControllerBase
{
    private readonly DbService _dbService;
    private readonly FirebaseAuthService _firebaseAuthService;

    public TripsController(DbService dbService,FirebaseAuthService firebaseAuthService)
    {
        _dbService = dbService;
        _firebaseAuthService = firebaseAuthService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTrips()
    {
        var user = await GetAuthenticatedUserAsync();

        if (user is null)
        {
            return Unauthorized("Invalid or missing Firebase ID token.");
        }

        var trips = await _dbService.GetTripsByUserIdAsync(user.Id);

        return Ok(trips);
    }

    /// <summary>Returns a single trip by its id only if it belongs to the authenticated user.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTripById(Guid id)
    {
        var user = await GetAuthenticatedUserAsync();

        if (user is null)
        {
            return Unauthorized("Invalid or missing Firebase ID token.");
        }

        var trip = await _dbService.GetTripByIdForUserAsync(id, user.Id);

        if (trip is null)
        {
            return NotFound($"Trip with id '{id}' was not found.");
        }

        return Ok(trip);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTrip([FromBody] CreateTripRequest request)
    {
        var user = await GetAuthenticatedUserAsync();

        if (user is null)
        {
            return Unauthorized("Invalid or missing Firebase ID token.");
        }

        var createdTrip =
            await _dbService.CreateTripAsync(request, user.Id);

        return Created($"/api/trips/{createdTrip.Id}", createdTrip);
    }

    /// <summary>Updates an existing trip by its id.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTrip(Guid id,[FromBody] UpdateTripRequest request )
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

    private async Task<AppUser?> GetAuthenticatedUserAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authorizationValues))
        {
            return null;
        }

        var authorizationHeader = authorizationValues.ToString();

        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            return null;
        }

        if (!authorizationHeader.StartsWith(
                "Bearer ",
                StringComparison.OrdinalIgnoreCase
            ))
        {
            return null;
        }

        var idToken = authorizationHeader["Bearer ".Length..].Trim();

        if (string.IsNullOrWhiteSpace(idToken))
        {
            return null;
        }

        FirebaseToken firebaseToken;

        try
        {
            firebaseToken =
                await _firebaseAuthService.VerifyIdTokenAsync(idToken);
        }
        catch
        {
            return null;
        }

        return await _dbService.GetUserByFirebaseUidAsync(firebaseToken.Uid);
    }
}