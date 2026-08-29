namespace Backend.Dtos.Expenses;

public class TripExpenseResponse
{
    public Guid Id { get; set; }

    public Guid TripId { get; set; }

    public string Category { get; set; } =
        string.Empty;

    public string Title { get; set; } =
        string.Empty;

    public decimal Amount { get; set; }

    public string Currency { get; set; } =
        string.Empty;

    public string? ReferenceUrl { get; set; }

    public string? Notes { get; set; }

    public Guid? ItineraryItemId { get; set; }

    public DateOnly? ItineraryDate { get; set; }

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}