namespace Backend.Dtos.Cities;

public sealed class CityResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string CountryCode { get; set; } = string.Empty;

    public string? Region { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public long Population { get; set; }
}