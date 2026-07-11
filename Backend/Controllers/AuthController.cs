using Backend.DAL;
using Backend.Dtos;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly FirebaseAuthService _firebaseAuthService;
    private readonly DbService _dbService;

    public AuthController(
        FirebaseAuthService firebaseAuthService,
        DbService dbService
    )
    {
        _firebaseAuthService = firebaseAuthService;
        _dbService = dbService;
    }

    /// <summary>
    /// Verifies a Firebase ID token and creates or updates the local user.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var firebaseToken =
            await _firebaseAuthService.VerifyIdTokenAsync(request.IdToken);

        var email = firebaseToken.Claims.TryGetValue("email", out var emailClaim)
            ? emailClaim?.ToString()
            : null;

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest("The Firebase token does not contain an email address.");
        }

        var displayName =
            firebaseToken.Claims.TryGetValue("name", out var nameClaim)
                ? nameClaim?.ToString()
                : null;

        var photoUrl =
            firebaseToken.Claims.TryGetValue("picture", out var pictureClaim)
                ? pictureClaim?.ToString()
                : null;

        var userRequest = new UpsertUserRequest
        {
            FirebaseUid = firebaseToken.Uid,
            Email = email,
            DisplayName = displayName,
            PhotoUrl = photoUrl
        };

        var user = await _dbService.UpsertUserAsync(userRequest);

        return Ok(user);
    }
}