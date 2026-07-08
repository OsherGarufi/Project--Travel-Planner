using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public class CreateTripRequest
{
    [Required]
    public Guid UserId { get; set; }

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

    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    public decimal? BudgetAmount { get; set; }

    [Required]
    [StringLength(3, MinimumLength = 3)]
    public string BudgetCurrency { get; set; } = "ILS";

    public string? Notes { get; set; }
}