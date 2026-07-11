using FirebaseAdmin.Auth;

namespace Backend.Services;

public class FirebaseAuthService
{
    /// <summary> Verifies a Firebase ID token and returns the decoded token. /// </summary>
    public async Task<FirebaseToken> VerifyIdTokenAsync(string idToken)
    {
        if (string.IsNullOrWhiteSpace(idToken))
        {
            throw new ArgumentException(
                "Firebase ID token cannot be empty.",
                nameof(idToken)
            );
        }

        return await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);
    }
}