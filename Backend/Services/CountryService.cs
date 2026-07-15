using System.Net.Http.Headers;
using System.Net.Http.Json;
using Backend.Dtos.Countries;
using Microsoft.Extensions.Caching.Memory;

namespace Backend.Services;

public class CountryService : ICountryService
{
    private const string CountriesCacheKey = "rest-countries-all";
    private const int PageLimit = 100;

    private static readonly SemaphoreSlim CountriesLock =
        new(1, 1);

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _memoryCache;

    public CountryService(
        HttpClient httpClient,
        IConfiguration configuration,
        IMemoryCache memoryCache)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _memoryCache = memoryCache;
    }

    public async Task<IReadOnlyList<CountryResponse>> GetCountriesAsync(
        CancellationToken cancellationToken = default)
    {
        if (_memoryCache.TryGetValue(
            CountriesCacheKey,
            out IReadOnlyList<CountryResponse>? cachedCountries))
        {
            return cachedCountries!;
        }

        await CountriesLock.WaitAsync(cancellationToken);

        try
        {
            if (_memoryCache.TryGetValue(
                CountriesCacheKey,
                out cachedCountries))
            {
                return cachedCountries!;
            }

            var apiKey =
                _configuration["RestCountries:ApiKey"];

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException(
                    "Missing REST Countries API key."
                );
            }

            var countries = new List<CountryResponse>();

            var offset = 0;
            var hasMoreCountries = true;

            while (hasMoreCountries)
            {
                var endpoint =
                    "countries/v5" +
                    $"?limit={PageLimit}" +
                    $"&offset={offset}" +
                    "&response_fields=" +
                    "names.common," +
                    "codes.alpha_2," +
                    "flag.url_png," +
                    "flag.url_svg," +
                    "capitals," +
                    "currencies," +
                    "languages," +
                    "population," +
                    "region";

                using var request =
                    new HttpRequestMessage(
                        HttpMethod.Get,
                        endpoint
                    );

                request.Headers.Authorization =
                    new AuthenticationHeaderValue(
                        "Bearer",
                        apiKey
                    );

                using var response =
                    await _httpClient.SendAsync(
                        request,
                        cancellationToken
                    );

                response.EnsureSuccessStatusCode();

                var apiResponse =
                    await response.Content
                        .ReadFromJsonAsync<RestCountriesApiResponse>(
                            cancellationToken: cancellationToken
                        );

                if (apiResponse is null)
                {
                    throw new InvalidOperationException(
                        "REST Countries returned an empty response."
                    );
                }

                var pageCountries =
    apiResponse.Data.Objects
        .Where(country =>
            !string.IsNullOrWhiteSpace(country.Codes.Alpha2) &&
            !string.IsNullOrWhiteSpace(country.Names.Common)
        )
        .Select(country =>
            new CountryResponse
            {
                Code = country.Codes.Alpha2,
                Name = country.Names.Common,
                FlagUrl =
                    country.Flag.UrlSvg ??
                    country.Flag.UrlPng,
                Capital =
                    country.Capitals
                        .FirstOrDefault()
                        ?.Name,
                Currencies =
                    country.Currencies
                        .Select(currency => currency.Code)
                        .Where(code =>
                            !string.IsNullOrWhiteSpace(code)
                        )
                        .ToList(),
                Languages =
                    country.Languages
                        .Select(language => language.Name)
                        .Where(language =>
                            !string.IsNullOrWhiteSpace(language)
                        )
                        .ToList(),
                Population = country.Population,
                Region = country.Region
            }
        );

                countries.AddRange(pageCountries);

                hasMoreCountries =
                    apiResponse.Data.Meta.More;

                offset += apiResponse.Data.Meta.Count;

                if (
                    apiResponse.Data.Meta.Count == 0 &&
                    hasMoreCountries
                )
                {
                    throw new InvalidOperationException(
                        "REST Countries pagination returned no records."
                    );
                }
            }

            var orderedCountries =
                countries
                    .OrderBy(country => country.Name)
                    .ToList()
                    .AsReadOnly();

            _memoryCache.Set(
                CountriesCacheKey,
                orderedCountries,
                TimeSpan.FromHours(24)
            );

            return orderedCountries;
        }
        finally
        {
            CountriesLock.Release();
        }
    }
}