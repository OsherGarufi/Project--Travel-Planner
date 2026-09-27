using System.Text.Json.Serialization;

namespace Backend.Dtos.DailyTravelTips;

public sealed class DailyTravelTipResponse
{
    [JsonRequired]
    public required string Title { get; init; }

    [JsonRequired]
    public required string Tip { get; init; }
}
