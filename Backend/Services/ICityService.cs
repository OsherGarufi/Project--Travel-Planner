using Backend.Dtos.Cities;

namespace Backend.Services;

public interface ICityService
{
    Task<IReadOnlyList<CityResponse>> GetMajorCitiesAsync(
        string countryCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CityResponse>> SearchCitiesAsync(
        string countryCode,
        string query,
        CancellationToken cancellationToken = default);
}