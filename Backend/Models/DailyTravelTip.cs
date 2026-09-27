namespace Backend.Models;

public sealed class DailyTravelTip
{
    public DateOnly TipDate { get; init; }

    public required string Title { get; init; }

    public required string Tip { get; init; }

    public DateTime CreatedAt { get; init; }
}
