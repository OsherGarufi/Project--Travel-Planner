using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos.Itinerary;

public abstract class TripItineraryItemRequestBase : IValidatableObject
{
    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    public DateOnly? ItineraryDate { get; set; }

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    [StringLength(2048)]
    public string? ReferenceUrl { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext
    )
    {
        if (string.IsNullOrWhiteSpace(Title))
        {
            yield return new ValidationResult(
                "Title is required.",
                new[] { nameof(Title) }
            );
        }

        if (string.IsNullOrWhiteSpace(Category))
        {
            yield return new ValidationResult(
                "Category is required.",
                new[] { nameof(Category) }
            );
        }

        var hasStartTime = StartTime.HasValue;
        var hasEndTime = EndTime.HasValue;

        if (hasStartTime != hasEndTime)
        {
            yield return new ValidationResult(
                "Start time and end time must either both be provided or both be empty.",
                new[]
                {
                    nameof(StartTime),
                    nameof(EndTime)
                }
            );
        }

        if (
            StartTime.HasValue &&
            EndTime.HasValue &&
            EndTime.Value <= StartTime.Value
        )
        {
            yield return new ValidationResult(
                "End time must be later than start time.",
                new[]
                {
                    nameof(StartTime),
                    nameof(EndTime)
                }
            );
        }

        if (string.IsNullOrWhiteSpace(ReferenceUrl))
        {
            yield break;
        }

        if (
            !Uri.TryCreate(
                ReferenceUrl.Trim(),
                UriKind.Absolute,
                out var uri
            ) ||
            (
                uri.Scheme != Uri.UriSchemeHttp &&
                uri.Scheme != Uri.UriSchemeHttps
            )
        )
        {
            yield return new ValidationResult(
                "Reference URL must be a valid HTTP or HTTPS URL.",
                new[] { nameof(ReferenceUrl) }
            );
        }
    }
}