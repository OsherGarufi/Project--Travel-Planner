using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos.Expenses;

public abstract class TripExpenseRequestBase :
    IValidatableObject
{
    [Required]
    [StringLength(50)]
    public string Category { get; set; } =
        string.Empty;

    [Required]
    [StringLength(100)]
    public string Title { get; set; } =
        string.Empty;

    [Range(
        typeof(decimal),
        "0.01",
        "9999999999.99",
        ErrorMessage =
            "Amount must be greater than zero."
    )]
    public decimal Amount { get; set; }

    [Required]
    [StringLength(
        3,
        MinimumLength = 3
    )]
    [RegularExpression(
        "^[A-Za-z]{3}$",
        ErrorMessage =
            "Currency must contain exactly 3 letters."
    )]
    public string Currency { get; set; } =
        string.Empty;

    [StringLength(2048)]
    public string? ReferenceUrl { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext
    )
    {
        if (
            string.IsNullOrWhiteSpace(
                ReferenceUrl
            )
        )
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
                uri.Scheme !=
                    Uri.UriSchemeHttp &&
                uri.Scheme !=
                    Uri.UriSchemeHttps
            )
        )
        {
            yield return new ValidationResult(
                "Reference URL must be a valid HTTP or HTTPS URL.",
                new[]
                {
                    nameof(ReferenceUrl)
                }
            );
        }
    }
}