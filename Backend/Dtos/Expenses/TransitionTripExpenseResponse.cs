using Backend.Dtos.Itinerary;

namespace Backend.Dtos.Expenses;

public class TransitionTripExpenseResponse
{
    public Guid ReplacedExpenseId { get; set; }

    public Guid? RemovedItineraryItemId { get; set; }

    public TripExpenseResponse Expense { get; set; } =
        null!;

    public TripItineraryItemResponse? ItineraryItem { get; set; }
}
