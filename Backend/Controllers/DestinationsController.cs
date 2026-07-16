using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DestinationsController : ControllerBase
{
    private readonly ICountryService _countryService;
    private readonly ICityService _cityService;

    public DestinationsController(
        ICountryService countryService,
        ICityService cityService)
    {
        _countryService = countryService;
        _cityService = cityService;
    }

    [HttpGet("countries")]
    public async Task<IActionResult> GetCountries(
        CancellationToken cancellationToken)
    {
        var countries =
            await _countryService.GetCountriesAsync(
                cancellationToken
            );

        return Ok(countries);
    }

    [HttpGet("countries/{countryCode}/cities/major")]
    public async Task<IActionResult> GetMajorCities(
        string countryCode,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(countryCode) ||
            countryCode.Trim().Length != 2 ||
            !countryCode.Trim().All(char.IsLetter))
        {
            return BadRequest(new
            {
                message =
                    "Country code must contain exactly two letters."
            });
        }

        var cities =
            await _cityService.GetMajorCitiesAsync(
                countryCode,
                cancellationToken
            );

        return Ok(cities);
    }

    [HttpGet("countries/{countryCode}/cities")]
    public async Task<IActionResult> SearchCities(
        string countryCode,
        [FromQuery] string query,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(countryCode) ||
            countryCode.Trim().Length != 2 ||
            !countryCode.Trim().All(char.IsLetter))
        {
            return BadRequest(new
            {
                message =
                    "Country code must contain exactly two letters."
            });
        }

        if (string.IsNullOrWhiteSpace(query) ||
            query.Trim().Length < 2)
        {
            return BadRequest(new
            {
                message =
                    "City search query must contain at least two characters."
            });
        }

        var cities =
            await _cityService.SearchCitiesAsync(
                countryCode,
                query,
                cancellationToken
            );

        return Ok(cities);
    }
}