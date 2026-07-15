namespace Backend.Dtos.Countries;

public class CountryResponse
{
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? FlagUrl { get; set; }

    public string? Capital { get; set; }

    public List<string> Currencies { get; set; } = [];

    public List<string> Languages { get; set; } = [];

    public long? Population { get; set; }

    public string? Region { get; set; }
}