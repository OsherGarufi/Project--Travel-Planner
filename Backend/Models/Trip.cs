namespace Backend.Models;

public class Trip
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string DestinationCountryCode { get; set; } = string.Empty;
    public string DestinationCountryName { get; set; } = string.Empty;
    public string DestinationCity { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    public decimal? BudgetAmount { get; set; }
    public string BudgetCurrency { get; set; } = "ILS";

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}