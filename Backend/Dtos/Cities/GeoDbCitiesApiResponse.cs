using System.Text.Json.Serialization;

namespace Backend.Dtos.Cities;

public sealed class GeoDbCitiesApiResponse
{
    [JsonPropertyName("data")]
    public List<GeoDbCityData> Data { get; set; } = [];

    [JsonPropertyName("metadata")]
    public GeoDbCitiesMetadata Metadata { get; set; } = new();
}

public sealed class GeoDbCityData
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("countryCode")]
    public string CountryCode { get; set; } = string.Empty;

    [JsonPropertyName("region")]
    public string? Region { get; set; }

    [JsonPropertyName("latitude")]
    public double Latitude { get; set; }

    [JsonPropertyName("longitude")]
    public double Longitude { get; set; }

    [JsonPropertyName("population")]
    public long Population { get; set; }
}

public sealed class GeoDbCitiesMetadata
{
    [JsonPropertyName("currentOffset")]
    public int CurrentOffset { get; set; }

    [JsonPropertyName("totalCount")]
    public int TotalCount { get; set; }
}