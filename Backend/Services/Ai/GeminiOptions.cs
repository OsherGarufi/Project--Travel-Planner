using System.ComponentModel.DataAnnotations;

namespace Backend.Services.Ai;

public sealed class GeminiOptions
{
    public const string SectionName = "Gemini";

    [Required]
    public string ApiKey { get; init; } = string.Empty;

    [Required]
    public string Model { get; init; } = string.Empty;

    [Range(1, 300)]
    public int TimeoutSeconds { get; init; } = 45;

    [Range(1, 2)]
    public int MaxAttempts { get; init; } = 2;
}
