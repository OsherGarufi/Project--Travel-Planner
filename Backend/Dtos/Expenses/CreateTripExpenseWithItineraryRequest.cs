using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos.Expenses;

public class CreateTripExpenseWithItineraryRequest
    : TripExpenseRequestBase
{
    public CreateExpenseItineraryRequest? Itinerary { get; set; }
}

public class CreateExpenseItineraryRequest
    : IValidatableObject
{
    public DateOnly? ItineraryDate { get; set; }

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext
    )
    {
        var hasStartTime =
            StartTime.HasValue;

        var hasEndTime =
            EndTime.HasValue;

        if (hasStartTime != hasEndTime)
        {
            yield return new ValidationResult(
                "Start time and end time must either both be provided or both be omitted.",
                [
                    nameof(StartTime),
                    nameof(EndTime)
                ]
            );
        }

        if (
            (hasStartTime || hasEndTime) &&
            !ItineraryDate.HasValue
        )
        {
            yield return new ValidationResult(
                "An itinerary date is required when start and end times are provided.",
                [
                    nameof(ItineraryDate)
                ]
            );
        }

        if (
            StartTime.HasValue &&
            EndTime.HasValue &&
            EndTime.Value <= StartTime.Value
        )
        {
            yield return new ValidationResult(
                "End time must be later than start time.",
                [
                    nameof(StartTime),
                    nameof(EndTime)
                ]
            );
        }
    }
}