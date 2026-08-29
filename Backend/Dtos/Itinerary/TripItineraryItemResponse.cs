namespace Backend.Dtos.Itinerary;

public class TripItineraryItemResponse
{
    public Guid Id { get; set; }

    public Guid TripId { get; set; }

    public Guid? ExpenseId { get; set; }

    public string Title { get; set; } =
        string.Empty;

    public string? Description { get; set; }

    public string Category { get; set; } =
        string.Empty;

    public DateOnly? ItineraryDate { get; set; }

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    public string? ReferenceUrl { get; set; }

    public decimal? Cost { get; set; }

    public string? Currency { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}