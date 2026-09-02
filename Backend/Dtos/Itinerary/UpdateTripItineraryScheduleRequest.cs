using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos.Itinerary;

public class UpdateTripItineraryScheduleRequest :
    IValidatableObject
{
    public DateOnly? ItineraryDate { get; set; }

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext
    )
    {
        var isGlobalUnscheduled =
            !ItineraryDate.HasValue &&
            !StartTime.HasValue &&
            !EndTime.HasValue;

        var isScheduled =
            ItineraryDate.HasValue &&
            StartTime.HasValue &&
            EndTime.HasValue;

        if (
            !isGlobalUnscheduled &&
            !isScheduled
        )
        {
            yield return new ValidationResult(
                "Schedule must contain a date, start time and end time together, or all schedule fields must be null.",
                new[]
                {
                    nameof(ItineraryDate),
                    nameof(StartTime),
                    nameof(EndTime)
                }
            );

            yield break;
        }

        if (
            isScheduled &&
            EndTime!.Value <=
            StartTime!.Value
        )
        {
            yield return new ValidationResult(
                "End time must be later than start time.",
                new[]
                {
                    nameof(StartTime),
                    nameof(EndTime)
                }
            );
        }
    }
}