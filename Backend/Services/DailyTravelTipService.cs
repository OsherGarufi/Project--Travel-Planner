using System.Text;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Backend.DAL;
using Backend.Dtos.DailyTravelTips;
using Backend.Models;
using Backend.Services.Ai;
using Microsoft.Extensions.Caching.Memory;

namespace Backend.Services;

public sealed class DailyTravelTipService
{
    private const string CacheKeyPrefix =
        "daily-travel-tip";

    private const int BatchSize = 7;
    private const int RecentTitleCount = 14;
    private const int MaximumTitleLength = 80;
    private const int MaximumTipLength = 300;

    private static readonly TimeSpan FailureCooldown =
        TimeSpan.FromMinutes(5);

    private static readonly SemaphoreSlim GenerationLock =
        new(1, 1);

    private static DateTimeOffset _cooldownUntilUtc =
        DateTimeOffset.MinValue;

    private static readonly JsonNode ResponseSchema =
        JsonNode.Parse(
            """
            {
              "type": "object",
              "properties": {
                "tips": {
                  "type": "array",
                  "minItems": 7,
                  "maxItems": 7,
                  "items": {
                    "type": "object",
                    "properties": {
                      "title": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 80
                      },
                      "tip": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 300
                      }
                    },
                    "required": ["title", "tip"],
                    "additionalProperties": false
                  }
                }
              },
              "required": ["tips"],
              "additionalProperties": false
            }
            """
        )!;

    private const string SystemInstruction = """
    You are the editorial travel-tip assistant for a travel-planning application.

    Your task is to create exactly 7 short daily travel tips that will be shown
    one per day to general travelers.

    The tips are shared content and are NOT personalized to a specific
    destination or user.

    OUTPUT LANGUAGE

    Generate all titles and tip text in English.
    Keep all JSON property names exactly as defined by the supplied schema.

    AUDIENCE

    Write for a general traveler using neutral second-person language ("you").

    Do not assume the traveler:
    - has a partner
    - has children
    - has a family
    - is traveling with other people
    - belongs to a particular age group
    - has a particular travel style

    If a tip applies only to a specific type of traveler, phrase it conditionally.

    QUALITY GOAL

    Every tip should provide a small piece of genuinely useful travel advice.

    Prefer practical, thoughtful advice that a traveler can actually use.

    Avoid filler, generic motivational statements, obvious clichés,
    or advice that provides little practical value.

    DIVERSITY

    The 7 tips must be meaningfully different from one another.

    Use at least 5 different travel topics across the batch.

    Possible topics include, but are not limited to:

    - packing
    - trip preparation
    - airports and flights
    - transportation
    - navigation
    - budgeting and payments
    - food
    - accommodation
    - local experiences
    - organization
    - travel technology
    - family travel
    - safety
    - comfort
    - time management

    Do not create multiple tips that are merely different versions of the
    same advice.

    RECENT CONTENT

    You may receive a list of recently published tip titles.

    Do not repeat them and do not create advice that is substantially the same
    idea using different wording.

    CONTENT RULES

    Each tip must:

    - be useful for real travel
    - be understandable without additional context
    - be destination-neutral
    - be concise
    - be written in neutral direct second-person language
    - have a short engaging title
    - contain no more than 2 short sentences
    - avoid unnecessary explanation
    - avoid advertising or brand promotion
    - contain no URLs
    - not mention AI or how the content was generated

    FACTUAL SAFETY

    Do not invent or state specific:

    - current prices
    - opening hours
    - transportation schedules
    - visa or border-entry requirements
    - current laws or regulations
    - current weather
    - current safety conditions
    - medical requirements

    Do not provide medical or legal advice.

    When advice depends on information that may change, advise the traveler
    to verify the relevant current information instead of presenting a fixed
    rule as fact.

    Do not suggest unsafe, illegal, or irresponsible behavior.

    OUTPUT

    Return exactly 7 tips according to the supplied JSON schema.

    Do not include commentary, Markdown, explanations, or content outside
    the structured response.
    """;

    private readonly DailyTravelTipDbService _dbService;
    private readonly IAiService _aiService;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<DailyTravelTipService> _logger;

    public DailyTravelTipService(
        DailyTravelTipDbService dbService,
        IAiService aiService,
        IMemoryCache memoryCache,
        ILogger<DailyTravelTipService> logger
    )
    {
        _dbService = dbService;
        _aiService = aiService;
        _memoryCache = memoryCache;
        _logger = logger;
    }

    public async Task<DailyTravelTipResponse?> GetTodayAsync(
        CancellationToken cancellationToken = default
    )
    {
        var nowUtc = DateTimeOffset.UtcNow;
        var todayUtc = DateOnly.FromDateTime(
            nowUtc.UtcDateTime
        );

        if (TryGetCached(
            todayUtc,
            out var cachedTip
        ))
        {
            return ToResponse(cachedTip!);
        }

        var storedTip =
            await _dbService.GetByDateAsync(
                todayUtc,
                cancellationToken
            );

        if (storedTip is not null)
        {
            CacheUntilNextUtcMidnight(
                storedTip,
                nowUtc
            );

            return ToResponse(storedTip);
        }

        await GenerationLock.WaitAsync(
            cancellationToken
        );

        try
        {
            nowUtc = DateTimeOffset.UtcNow;
            todayUtc = DateOnly.FromDateTime(
                nowUtc.UtcDateTime
            );

            if (TryGetCached(
                todayUtc,
                out cachedTip
            ))
            {
                return ToResponse(cachedTip!);
            }

            storedTip =
                await _dbService.GetByDateAsync(
                    todayUtc,
                    cancellationToken
                );

            if (storedTip is not null)
            {
                CacheUntilNextUtcMidnight(
                    storedTip,
                    nowUtc
                );

                return ToResponse(storedTip);
            }

            if (nowUtc < _cooldownUntilUtc)
            {
                return await GetStaleFallbackAsync(
                    todayUtc,
                    cancellationToken
                );
            }

            try
            {
                var recentTitles =
                    await _dbService.GetRecentTitlesAsync(
                        todayUtc,
                        RecentTitleCount,
                        cancellationToken
                    );

                var generatedBatch =
                    await _aiService
                        .GenerateStructuredAsync<GeneratedTipBatch>(
                            new AiGenerationRequest(
                                SystemInstruction,
                                BuildRecentTitleContent(
                                    recentTitles
                                ),
                                ResponseSchema,
                                "daily-travel-tip-batch"
                            ),
                            cancellationToken
                        );

                var validatedTips = ValidateBatch(
                    generatedBatch
                );

                nowUtc = DateTimeOffset.UtcNow;
                todayUtc = DateOnly.FromDateTime(
                    nowUtc.UtcDateTime
                );

                var datedTips = validatedTips
                    .Select(
                        (tip, index) =>
                            new DailyTravelTip
                            {
                                TipDate = todayUtc.AddDays(index),
                                Title = tip.Title,
                                Tip = tip.Tip
                            }
                    )
                    .ToList();

                var inserted =
                    await _dbService.TryInsertBatchAsync(
                        datedTips,
                        cancellationToken
                    );

                if (!inserted)
                {
                    storedTip =
                        await _dbService.GetByDateAsync(
                            todayUtc,
                            cancellationToken
                        );

                    if (storedTip is null)
                    {
                        return await GetStaleFallbackAsync(
                            todayUtc,
                            cancellationToken
                        );
                    }

                    CacheUntilNextUtcMidnight(
                        storedTip,
                        nowUtc
                    );

                    return ToResponse(storedTip);
                }

                var todayTip = datedTips[0];

                CacheUntilNextUtcMidnight(
                    todayTip,
                    nowUtc
                );

                return ToResponse(todayTip);
            }
            catch (AiServiceException exception)
            {
                _cooldownUntilUtc =
                    DateTimeOffset.UtcNow.Add(
                        FailureCooldown
                    );

                _logger.LogWarning(
                    "Daily travel tip generation failed. Failure: {FailureKind}; provider status: {ProviderStatusCode}. Cooldown until {CooldownUntilUtc}.",
                    exception.FailureKind,
                    exception.ProviderStatusCode,
                    _cooldownUntilUtc
                );

                return await GetStaleFallbackAsync(
                    todayUtc,
                    cancellationToken
                );
            }
        }
        finally
        {
            GenerationLock.Release();
        }
    }

    private bool TryGetCached(
        DateOnly tipDate,
        out DailyTravelTip? tip
    )
    {
        return _memoryCache.TryGetValue(
            GetCacheKey(tipDate),
            out tip
        );
    }

    private void CacheUntilNextUtcMidnight(
        DailyTravelTip tip,
        DateTimeOffset nowUtc
    )
    {
        var nextUtcMidnight =
            new DateTimeOffset(
                nowUtc.UtcDateTime.Date.AddDays(1),
                TimeSpan.Zero
            );

        _memoryCache.Set(
            GetCacheKey(tip.TipDate),
            tip,
            nextUtcMidnight
        );
    }

    private async Task<DailyTravelTipResponse?>
        GetStaleFallbackAsync(
            DateOnly todayUtc,
            CancellationToken cancellationToken
        )
    {
        var staleTip =
            await _dbService.GetLatestBeforeAsync(
                todayUtc,
                cancellationToken
            );

        return staleTip is null
            ? null
            : ToResponse(staleTip);
    }

    private static IReadOnlyList<DailyTravelTipResponse>
        ValidateBatch(
            GeneratedTipBatch batch
        )
    {
        if (
            batch.Tips is null ||
            batch.Tips.Count != BatchSize
        )
        {
            throw InvalidBatch(
                "The generated batch did not contain exactly seven tips."
            );
        }

        var titles = new HashSet<string>(
            StringComparer.Ordinal
        );

        var tipTexts = new HashSet<string>(
            StringComparer.Ordinal
        );

        var validatedTips =
            new List<DailyTravelTipResponse>(
                BatchSize
            );

        foreach (var generatedTip in batch.Tips)
        {
            if (generatedTip is null)
            {
                throw InvalidBatch(
                    "The generated batch contained a null tip."
                );
            }

            if (
                generatedTip.Title is null ||
                generatedTip.Tip is null
            )
            {
                throw InvalidBatch(
                    "A generated tip contained a null value."
                );
            }

            var title = generatedTip.Title.Trim();
            var tip = generatedTip.Tip.Trim();

            if (
                title.Length == 0 ||
                title.Length > MaximumTitleLength
            )
            {
                throw InvalidBatch(
                    "A generated title had an invalid length."
                );
            }

            if (
                tip.Length == 0 ||
                tip.Length > MaximumTipLength
            )
            {
                throw InvalidBatch(
                    "Generated tip text had an invalid length."
                );
            }

            if (!titles.Add(Normalize(title)))
            {
                throw InvalidBatch(
                    "The generated batch contained duplicate titles."
                );
            }

            if (!tipTexts.Add(Normalize(tip)))
            {
                throw InvalidBatch(
                    "The generated batch contained duplicate tip text."
                );
            }

            validatedTips.Add(
                new DailyTravelTipResponse
                {
                    Title = title,
                    Tip = tip
                }
            );
        }

        return validatedTips;
    }

    private static string BuildRecentTitleContent(
        IReadOnlyList<string> recentTitles
    )
    {
        if (recentTitles.Count == 0)
        {
            return "No previous tips are available yet.";
        }

        var content = new StringBuilder(
            "Recently published tip titles to avoid:"
        );

        foreach (var title in recentTitles)
        {
            content.Append("\n\n- ");
            content.Append(title);
        }

        return content.ToString();
    }

    private static string Normalize(string value)
    {
        return string.Join(
                ' ',
                value.Split(
                    new[]
                    {
                        ' ',
                        '\t',
                        '\r',
                        '\n'
                    },
                    StringSplitOptions.RemoveEmptyEntries
                )
            )
            .ToUpperInvariant();
    }

    private static AiServiceException InvalidBatch(
        string message
    )
    {
        return new AiServiceException(
            AiFailureKind.InvalidStructuredOutput,
            message
        );
    }

    private static DailyTravelTipResponse ToResponse(
        DailyTravelTip tip
    )
    {
        return new DailyTravelTipResponse
        {
            Title = tip.Title,
            Tip = tip.Tip
        };
    }

    private static string GetCacheKey(
        DateOnly tipDate
    )
    {
        return $"{CacheKeyPrefix}:{tipDate:yyyy-MM-dd}";
    }

    private sealed class GeneratedTipBatch
    {
        public GeneratedTipBatch()
        {
        }

        [JsonRequired]
        public required List<DailyTravelTipResponse?> Tips
        {
            get;
            init;
        }
    }
}
