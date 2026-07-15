using System.Text.Json.Serialization;

namespace Backend.Dtos.Countries;

public class RestCountriesApiResponse
{
    [JsonPropertyName("data")]
    public RestCountriesData Data { get; set; } = new();
}

public class RestCountriesData
{
    [JsonPropertyName("objects")]
    public List<RestCountryObject> Objects { get; set; } = [];

    [JsonPropertyName("meta")]
    public RestCountriesMeta Meta { get; set; } = new();
}

public class RestCountriesMeta
{
    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("limit")]
    public int Limit { get; set; }

    [JsonPropertyName("offset")]
    public int Offset { get; set; }

    [JsonPropertyName("more")]
    public bool More { get; set; }
}

public class RestCountryObject
{
    [JsonPropertyName("names")]
    public RestCountryNames Names { get; set; } = new();

    [JsonPropertyName("codes")]
    public RestCountryCodes Codes { get; set; } = new();

    [JsonPropertyName("flag")]
    public RestCountryFlag Flag { get; set; } = new();

    [JsonPropertyName("capitals")]
    public List<RestCountryCapital> Capitals { get; set; } = [];

    [JsonPropertyName("currencies")]
    public List<RestCountryCurrency> Currencies { get; set; } = [];

    [JsonPropertyName("languages")]
    public List<RestCountryLanguage> Languages { get; set; } = [];

    [JsonPropertyName("population")]
    public long? Population { get; set; }

    [JsonPropertyName("region")]
    public string? Region { get; set; }
}

public class RestCountryNames
{
    [JsonPropertyName("common")]
    public string Common { get; set; } = string.Empty;
}

public class RestCountryCodes
{
    [JsonPropertyName("alpha_2")]
    public string Alpha2 { get; set; } = string.Empty;
}

public class RestCountryFlag
{
    [JsonPropertyName("url_png")]
    public string? UrlPng { get; set; }

    [JsonPropertyName("url_svg")]
    public string? UrlSvg { get; set; }

    [JsonPropertyName("emoji")]
    public string? Emoji { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public class RestCountryCapital
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class RestCountryCurrency
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("symbol")]
    public string? Symbol { get; set; }
}

public class RestCountryLanguage
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("native_name")]
    public string? NativeName { get; set; }
}