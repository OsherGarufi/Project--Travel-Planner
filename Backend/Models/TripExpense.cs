namespace Backend.Models;

public class TripExpense
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }

    public string Category { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;

    public DateOnly? ExpenseDate { get; set; }

    public string? ReferenceUrl { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}