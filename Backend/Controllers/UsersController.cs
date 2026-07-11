using Backend.DAL;
using Backend.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly DbService _dbService;

    public UsersController(DbService dbService)
    {
        _dbService = dbService;
    }

    /// <summary>Creates a new user or updates an existing user by Firebase UID.</summary>
    [HttpPost("upsert")]
    public async Task<IActionResult> UpsertUser([FromBody] UpsertUserRequest request)
    {
        var user = await _dbService.UpsertUserAsync(request);

        return Ok(user);
    }

    /// <summary>Returns a user by Firebase UID.</summary>
    [HttpGet("firebase/{firebaseUid}")]
    public async Task<IActionResult> GetUserByFirebaseUid(string firebaseUid)
    {
        var user = await _dbService.GetUserByFirebaseUidAsync(firebaseUid);

        if (user is null)
        {
            return NotFound($"User with Firebase UID '{firebaseUid}' was not found.");
        }

        return Ok(user);
    }

}