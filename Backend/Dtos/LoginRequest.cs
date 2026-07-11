using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public class LoginRequest
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}