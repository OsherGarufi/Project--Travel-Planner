using Backend.DAL;
using Backend.Models;
using Microsoft.AspNetCore.Http;

namespace Backend.Services;

public class CurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly FirebaseAuthService _firebaseAuthService;
    private readonly DbService _dbService;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor,
        FirebaseAuthService firebaseAuthService,
        DbService dbService
    )
    {
        _httpContextAccessor = httpContextAccessor;
        _firebaseAuthService = firebaseAuthService;
        _dbService = dbService;
    }

    /// <summary>
    /// Returns the local application user for the current authenticated request.
    /// Returns null when the Firebase ID token is missing or invalid.
    /// </summary>
    public async Task<AppUser?> GetCurrentUserAsync()
    {
        var httpContext = _httpContextAccessor.HttpContext;

        if (httpContext is null)
        {
            return null;
        }

        if (!httpContext.Request.Headers.TryGetValue(
                "Authorization",
                out var authorizationValues
            ))
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

        var idToken =
            authorizationHeader["Bearer ".Length..].Trim();

        if (string.IsNullOrWhiteSpace(idToken))
        {
            return null;
        }

        string firebaseUid;

        try
        {
            var firebaseToken =
                await _firebaseAuthService.VerifyIdTokenAsync(idToken);

            firebaseUid = firebaseToken.Uid;
        }
        catch
        {
            return null;
        }

        return await _dbService.GetUserByFirebaseUidAsync(
            firebaseUid
        );
    }
}