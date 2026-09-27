using System.Text.Json.Serialization;

namespace Backend.Dtos.TripNotes;

internal sealed class OrganizedTripNotesAiResponse
{
    [JsonRequired]
    public required List<OrganizedTripNotesSection> Sections { get; init; }
}

internal sealed class OrganizedTripNotesSection
{
    [JsonRequired]
    public required string Title { get; init; }

    [JsonRequired]
    public required List<string> Items { get; init; }
}
