namespace Backend.Dtos.Expenses;

public class TransitionTripExpenseRequest :
    TripExpenseRequestBase
{
    public CreateExpenseItineraryRequest? Itinerary { get; set; }
}
