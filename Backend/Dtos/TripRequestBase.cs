using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public abstract class TripRequestBase : IValidatableObject
{
    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2, MinimumLength = 2)]
    public string DestinationCountryCode { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string DestinationCountryName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string DestinationCity { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    [Range(
        typeof(decimal),
        "0",
        "79228162514264337593543950335",
        ErrorMessage = "Budget amount cannot be negative."
    )]
    public decimal? BudgetAmount { get; set; }

    [Required]
    [StringLength(3, MinimumLength = 3)]
    public string BudgetCurrency { get; set; } = "ILS";

    public string? Notes { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext
    )
    {
        if (EndDate < StartDate)
        {
            yield return new ValidationResult(
                "End date cannot be before start date.",
                new[] { nameof(EndDate) }
            );
        }
    }
}