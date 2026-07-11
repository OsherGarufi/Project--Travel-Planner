using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public class UpsertUserRequest
{
    [Required]
    public string FirebaseUid { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    public string? DisplayName { get; set; }

    [Url]
    public string? PhotoUrl { get; set; }
}