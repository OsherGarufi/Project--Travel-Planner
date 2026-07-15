using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DestinationsController : ControllerBase
{
    private readonly ICountryService _countryService;

    public DestinationsController(
        ICountryService countryService)
    {
        _countryService = countryService;
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
}