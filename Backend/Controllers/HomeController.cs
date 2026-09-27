using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class HomeController : ControllerBase
{
    private readonly DailyTravelTipService _dailyTravelTipService;

    public HomeController(
        DailyTravelTipService dailyTravelTipService
    )
    {
        _dailyTravelTipService = dailyTravelTipService;
    }

    [HttpGet("daily-travel-tip")]
    public async Task<IActionResult> GetDailyTravelTip(
        CancellationToken cancellationToken
    )
    {
        var tip =
            await _dailyTravelTipService.GetTodayAsync(
                cancellationToken
            );

        return tip is null
            ? NoContent()
            : Ok(tip);
    }
}
