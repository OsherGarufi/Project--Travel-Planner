namespace Backend.Models;

public class AppUser
{
    public Guid Id { get; set; }

    public string FirebaseUid { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? DisplayName { get; set; }

    public string? PhotoUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}