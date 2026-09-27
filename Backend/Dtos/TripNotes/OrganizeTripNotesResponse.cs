using System.Text.Json.Serialization;

namespace Backend.Dtos.TripNotes;

public sealed class OrganizeTripNotesResponse
{
    [JsonRequired]
    public required string OrganizedNotes { get; init; }
}
