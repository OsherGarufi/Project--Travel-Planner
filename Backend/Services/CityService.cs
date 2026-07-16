using System.Collections.Concurrent;
using System.Net.Http.Json;
using Backend.Dtos.Cities;
using Microsoft.Extensions.Caching.Memory;

namespace Backend.Services;

public sealed class CityService : ICityService
{
    private const int MaximumResults = 10;
    private const int MaximumMajorCitiesPages = 5;

    private static readonly TimeSpan CacheDuration =
        TimeSpan.FromHours(1);

    private static readonly TimeSpan MinimumRequestInterval =
        TimeSpan.FromSeconds(1);

    private static readonly SemaphoreSlim RateLimiter =
        new(1, 1);

    private static readonly ConcurrentDictionary<
        string,
        Lazy<Task<IReadOnlyList<CityResponse>>>> InFlightRequests =
        new();

    private static readonly string[] AdministrativeNamePrefixes =
    {
        "Metropolitan City of ",
        "Metropolitan Area of ",
        "Province of ",
        "Region of ",
        "County of ",
        "District of ",
        "Prefecture of ",
        "Governorate of ",
        "Department of ",
        "Municipality of ",
        "Autonomous Region of ",
        "Capital Region of ",
        "Federal District of "
    };

    private static readonly string[] AdministrativeNameSuffixes =
    {
        " Province",
        " Region",
        " County",
        " District",
        " Prefecture",
        " Governorate",
        " Department",
        " Municipality"
    };

    private static DateTimeOffset _lastExternalRequestAt =
        DateTimeOffset.MinValue;

    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _memoryCache;

    public CityService(
        HttpClient httpClient,
        IMemoryCache memoryCache)
    {
        _httpClient = httpClient;
        _memoryCache = memoryCache;
    }

    public async Task<IReadOnlyList<CityResponse>> GetMajorCitiesAsync(
        string countryCode,
        CancellationToken cancellationToken = default)
    {
        var normalizedCountryCode =
            NormalizeCountryCode(countryCode);

        var cacheKey =
            CreateMajorCitiesCacheKey(normalizedCountryCode);

        if (_memoryCache.TryGetValue(
                cacheKey,
                out IReadOnlyList<CityResponse>? cachedCities) &&
            cachedCities is not null)
        {
            return cachedCities;
        }

        var sharedRequest = InFlightRequests.GetOrAdd(
            cacheKey,
            _ => new Lazy<Task<IReadOnlyList<CityResponse>>>(
                () => FetchAndCacheMajorCitiesAsync(
                    normalizedCountryCode,
                    cacheKey),
                LazyThreadSafetyMode.ExecutionAndPublication));

        var requestTask = sharedRequest.Value;

        _ = requestTask.ContinueWith(
            completedTask =>
            {
                InFlightRequests.TryRemove(cacheKey, out _);
            },
            CancellationToken.None,
            TaskContinuationOptions.ExecuteSynchronously,
            TaskScheduler.Default);

        return await requestTask.WaitAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CityResponse>> SearchCitiesAsync(
        string countryCode,
        string query,
        CancellationToken cancellationToken = default)
    {
        var normalizedCountryCode =
            NormalizeCountryCode(countryCode);

        var normalizedQuery =
            NormalizeQuery(query);

        var cacheKey = CreateSearchCacheKey(
            normalizedCountryCode,
            normalizedQuery);

        if (_memoryCache.TryGetValue(
                cacheKey,
                out IReadOnlyList<CityResponse>? cachedCities) &&
            cachedCities is not null)
        {
            return cachedCities;
        }

        var sharedRequest = InFlightRequests.GetOrAdd(
            cacheKey,
            _ => new Lazy<Task<IReadOnlyList<CityResponse>>>(
                () => FetchAndCacheSearchedCitiesAsync(
                    normalizedCountryCode,
                    normalizedQuery,
                    cacheKey),
                LazyThreadSafetyMode.ExecutionAndPublication));

        var requestTask = sharedRequest.Value;

        _ = requestTask.ContinueWith(
            completedTask =>
            {
                InFlightRequests.TryRemove(cacheKey, out _);
            },
            CancellationToken.None,
            TaskContinuationOptions.ExecuteSynchronously,
            TaskScheduler.Default);

        return await requestTask.WaitAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<CityResponse>>
        FetchAndCacheMajorCitiesAsync(
            string countryCode,
            string cacheKey)
    {
        var collectedCities = new List<CityResponse>();
        var collectedCityIds = new HashSet<int>();

        for (
            var pageIndex = 0;
            pageIndex < MaximumMajorCitiesPages &&
            collectedCities.Count < MaximumResults;
            pageIndex++)
        {
            var offset =
                pageIndex * MaximumResults;

            var requestUrl =
                $"v1/geo/cities" +
                $"?countryIds={Uri.EscapeDataString(countryCode)}" +
                $"&types=CITY" +
                $"&limit={MaximumResults}" +
                $"&offset={offset}" +
                $"&sort=-population" +
                $"&languageCode=en" +
                $"&hateoasMode=false";

            var apiResponse =
                await SendRateLimitedRequestAsync(requestUrl);

            foreach (var city in apiResponse.Data)
            {
                if (IsAdministrativeEntity(city))
                {
                    continue;
                }

                if (!collectedCityIds.Add(city.Id))
                {
                    continue;
                }

                collectedCities.Add(
                    MapCity(city)
                );

                if (collectedCities.Count == MaximumResults)
                {
                    break;
                }
            }

            var reachedLastPage =
                apiResponse.Data.Count < MaximumResults ||
                offset + apiResponse.Data.Count >=
                apiResponse.Metadata.TotalCount;

            if (reachedLastPage)
            {
                break;
            }
        }

        IReadOnlyList<CityResponse> cities =
            collectedCities;

        SaveCitiesInCache(
            cacheKey,
            cities);

        return cities;
    }

    private async Task<IReadOnlyList<CityResponse>>
        FetchAndCacheSearchedCitiesAsync(
            string countryCode,
            string query,
            string cacheKey)
    {
        var requestUrl =
            $"v1/geo/cities" +
            $"?countryIds={Uri.EscapeDataString(countryCode)}" +
            $"&types=CITY" +
            $"&namePrefix={Uri.EscapeDataString(query)}" +
            $"&limit={MaximumResults}" +
            $"&offset=0" +
            $"&sort=-population" +
            $"&languageCode=en" +
            $"&hateoasMode=false";

        var apiResponse =
            await SendRateLimitedRequestAsync(requestUrl);

        var cities =
            MapCities(apiResponse);

        SaveCitiesInCache(
            cacheKey,
            cities);

        return cities;
    }

    private async Task<GeoDbCitiesApiResponse>
        SendRateLimitedRequestAsync(
            string requestUrl)
    {
        await RateLimiter.WaitAsync();

        try
        {
            var elapsedSinceLastRequest =
                DateTimeOffset.UtcNow - _lastExternalRequestAt;

            var remainingDelay =
                MinimumRequestInterval - elapsedSinceLastRequest;

            if (remainingDelay > TimeSpan.Zero)
            {
                await Task.Delay(remainingDelay);
            }

            _lastExternalRequestAt =
                DateTimeOffset.UtcNow;

            using var response =
                await _httpClient.GetAsync(requestUrl);

            response.EnsureSuccessStatusCode();

            var apiResponse =
                await response.Content
                    .ReadFromJsonAsync<GeoDbCitiesApiResponse>();

            return apiResponse
                ?? throw new InvalidOperationException(
                    "GeoDB returned an empty response.");
        }
        finally
        {
            RateLimiter.Release();
        }
    }

    private static IReadOnlyList<CityResponse> MapCities(
        GeoDbCitiesApiResponse apiResponse)
    {
        return apiResponse.Data
            .Where(city => !IsAdministrativeEntity(city))
            .GroupBy(city => city.Id)
            .Select(group => MapCity(group.First()))
            .Take(MaximumResults)
            .ToList();
    }

    private static CityResponse MapCity(
        GeoDbCityData city)
    {
        return new CityResponse
        {
            Id = city.Id,
            Name = city.Name,
            CountryCode = city.CountryCode,
            Region = city.Region,
            Latitude = city.Latitude,
            Longitude = city.Longitude,
            Population = city.Population
        };
    }

    private static bool IsAdministrativeEntity(
        GeoDbCityData city)
    {
        var cityName =
            city.Name.Trim();

        var startsWithAdministrativePrefix =
            AdministrativeNamePrefixes.Any(
                prefix => cityName.StartsWith(
                    prefix,
                    StringComparison.OrdinalIgnoreCase)
            );

        if (startsWithAdministrativePrefix)
        {
            return true;
        }

        var endsWithAdministrativeSuffix =
            AdministrativeNameSuffixes.Any(
                suffix => cityName.EndsWith(
                    suffix,
                    StringComparison.OrdinalIgnoreCase)
            );

        if (endsWithAdministrativeSuffix)
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(city.Region) &&
            city.Region.StartsWith(
                $"{cityName}-",
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private void SaveCitiesInCache(
        string cacheKey,
        IReadOnlyList<CityResponse> cities)
    {
        _memoryCache.Set(
            cacheKey,
            cities,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow =
                    CacheDuration
            });
    }

    private static string NormalizeCountryCode(
        string countryCode)
    {
        if (string.IsNullOrWhiteSpace(countryCode))
        {
            throw new ArgumentException(
                "Country code is required.",
                nameof(countryCode));
        }

        var normalizedCountryCode =
            countryCode.Trim().ToUpperInvariant();

        if (normalizedCountryCode.Length != 2 ||
            !normalizedCountryCode.All(char.IsLetter))
        {
            throw new ArgumentException(
                "Country code must contain exactly two letters.",
                nameof(countryCode));
        }

        return normalizedCountryCode;
    }

    private static string NormalizeQuery(
        string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            throw new ArgumentException(
                "City search query is required.",
                nameof(query));
        }

        var normalizedQuery =
            string.Join(
                " ",
                query
                    .Trim()
                    .ToLowerInvariant()
                    .Split(
                        ' ',
                        StringSplitOptions.RemoveEmptyEntries));

        if (normalizedQuery.Length < 2)
        {
            throw new ArgumentException(
                "City search query must contain at least two characters.",
                nameof(query));
        }

        return normalizedQuery;
    }

    private static string CreateMajorCitiesCacheKey(
        string countryCode)
    {
        return $"cities:major:{countryCode}";
    }

    private static string CreateSearchCacheKey(
        string countryCode,
        string query)
    {
        return $"cities:search:{countryCode}:{query}";
    }
}