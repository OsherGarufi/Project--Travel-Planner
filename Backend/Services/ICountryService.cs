using Backend.Dtos.Countries;

namespace Backend.Services;

public interface ICountryService
{
    Task<IReadOnlyList<CountryResponse>> GetCountriesAsync(
        CancellationToken cancellationToken = default);
}