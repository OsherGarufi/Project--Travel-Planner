using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using Google.GenAI;
using Google.GenAI.Types;
using Microsoft.Extensions.Options;

namespace Backend.Services.Ai;

public sealed class GeminiAiService : IAiService
{
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = false,
            UnmappedMemberHandling =
                JsonUnmappedMemberHandling.Disallow
        };

    private readonly Client _client;
    private readonly GeminiOptions _options;
    private readonly ILogger<GeminiAiService> _logger;

    public GeminiAiService(
        Client client,
        IOptions<GeminiOptions> options,
        ILogger<GeminiAiService> logger
    )
    {
        _client = client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<TResponse> GenerateStructuredAsync<TResponse>(
        AiGenerationRequest request,
        CancellationToken cancellationToken = default
    )
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.SystemInstruction))
        {
            throw new ArgumentException(
                "A system instruction is required.",
                nameof(request)
            );
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ArgumentException(
                "Controlled content is required.",
                nameof(request)
            );
        }

        ArgumentNullException.ThrowIfNull(
            request.ResponseJsonSchema
        );

        var operationName =
            string.IsNullOrWhiteSpace(request.OperationName)
                ? "structured-generation"
                : request.OperationName;

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var response =
                await _client.Models.GenerateContentAsync(
                    model: _options.Model,
                    contents: request.Content,
                    config: new GenerateContentConfig
                    {
                        SystemInstruction = new Content
                        {
                            Parts =
                            [
                                new Part
                                {
                                    Text = request.SystemInstruction
                                }
                            ]
                        },
                        ResponseMimeType = "application/json",
                        ResponseJsonSchema =
                            request.ResponseJsonSchema
                    },
                    cancellationToken: cancellationToken
                );

            if (response.PromptFeedback?.BlockReason is not null)
            {
                throw new AiServiceException(
                    AiFailureKind.Blocked,
                    "The AI provider blocked the response."
                );
            }

            var candidate = response.Candidates?.FirstOrDefault();

            if (candidate is null)
            {
                throw new AiServiceException(
                    AiFailureKind.EmptyResponse,
                    "The AI provider returned no response candidate."
                );
            }

            if (IsBlocked(candidate.FinishReason))
            {
                throw new AiServiceException(
                    AiFailureKind.Blocked,
                    "The AI provider blocked the response."
                );
            }

            var generatedJson = string.Concat(
                candidate.Content?.Parts?
                    .Select(part => part.Text)
                    .Where(text =>
                        !string.IsNullOrWhiteSpace(text)
                    )
                ?? []
            );

            if (string.IsNullOrWhiteSpace(generatedJson))
            {
                throw new AiServiceException(
                    AiFailureKind.EmptyResponse,
                    "The AI provider returned an empty response."
                );
            }

            JsonDocument document;

            try
            {
                document = JsonDocument.Parse(generatedJson);
            }
            catch (JsonException exception)
            {
                throw new AiServiceException(
                    AiFailureKind.MalformedResponse,
                    "The AI provider returned malformed JSON.",
                    innerException: exception
                );
            }

            using (document)
            {
                TResponse? result;

                try
                {
                    result = JsonSerializer.Deserialize<TResponse>(
                        document.RootElement.GetRawText(),
                        JsonOptions
                    );
                }
                catch (JsonException exception)
                {
                    throw new AiServiceException(
                        AiFailureKind.InvalidStructuredOutput,
                        "The AI response did not match the required structure.",
                        innerException: exception
                    );
                }

                if (result is null)
                {
                    throw new AiServiceException(
                        AiFailureKind.InvalidStructuredOutput,
                        "The AI response did not contain the required structure."
                    );
                }

                LogSuccess(
                    operationName,
                    stopwatch.ElapsedMilliseconds,
                    response.UsageMetadata
                );

                return result;
            }
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogInformation(
                "AI operation {OperationName} was canceled by the caller after {ElapsedMilliseconds} ms.",
                operationName,
                stopwatch.ElapsedMilliseconds
            );

            throw;
        }
        catch (OperationCanceledException exception)
        {
            var failure = new AiServiceException(
                AiFailureKind.TimedOut,
                "The AI provider request timed out.",
                innerException: exception
            );

            LogFailure(
                operationName,
                failure,
                stopwatch.ElapsedMilliseconds
            );

            throw failure;
        }
        catch (ApiException exception)
        {
            var failure = CreateProviderFailure(
                exception.StatusCode
            );

            LogFailure(
                operationName,
                failure,
                stopwatch.ElapsedMilliseconds
            );

            throw failure;
        }
        catch (HttpRequestException exception)
        {
            var statusCode = exception.StatusCode.HasValue
                ? (int)exception.StatusCode.Value
                : (int?)null;

            var failure = statusCode.HasValue
                ? CreateProviderFailure(statusCode.Value)
                : new AiServiceException(
                    AiFailureKind.TemporarilyUnavailable,
                    "The AI provider is temporarily unavailable."
                );

            LogFailure(
                operationName,
                failure,
                stopwatch.ElapsedMilliseconds
            );

            throw failure;
        }
        catch (AiServiceException exception)
        {
            LogFailure(
                operationName,
                exception,
                stopwatch.ElapsedMilliseconds
            );

            throw;
        }
    }

    private static bool IsBlocked(FinishReason? finishReason)
    {
        return finishReason == FinishReason.Safety ||
            finishReason == FinishReason.Recitation ||
            finishReason == FinishReason.Language ||
            finishReason == FinishReason.Blocklist ||
            finishReason == FinishReason.ProhibitedContent ||
            finishReason == FinishReason.Spii ||
            finishReason == FinishReason.ImageSafety ||
            finishReason == FinishReason.ImageProhibitedContent ||
            finishReason == FinishReason.ImageRecitation;
    }

    private static AiServiceException CreateProviderFailure(
        int statusCode
    )
    {
        return statusCode switch
        {
            StatusCodes.Status429TooManyRequests =>
                new AiServiceException(
                    AiFailureKind.RateLimited,
                    "The AI provider rate limit was reached.",
                    statusCode
                ),

            StatusCodes.Status408RequestTimeout =>
                new AiServiceException(
                    AiFailureKind.TimedOut,
                    "The AI provider request timed out.",
                    statusCode
                ),

            >= 500 and <= 599 =>
                new AiServiceException(
                    AiFailureKind.TemporarilyUnavailable,
                    "The AI provider is temporarily unavailable.",
                    statusCode
                ),

            _ =>
                new AiServiceException(
                    AiFailureKind.ProviderRejectedRequest,
                    "The AI provider rejected the request.",
                    statusCode
                )
        };
    }

    private void LogSuccess(
        string operationName,
        long elapsedMilliseconds,
        GenerateContentResponseUsageMetadata? usage
    )
    {
        _logger.LogInformation(
            "AI operation {OperationName} completed using model {Model} in {ElapsedMilliseconds} ms. Prompt tokens: {PromptTokens}; candidate tokens: {CandidateTokens}; total tokens: {TotalTokens}.",
            operationName,
            _options.Model,
            elapsedMilliseconds,
            usage?.PromptTokenCount,
            usage?.CandidatesTokenCount,
            usage?.TotalTokenCount
        );
    }

    private void LogFailure(
        string operationName,
        AiServiceException exception,
        long elapsedMilliseconds
    )
    {
        _logger.LogWarning(
            "AI operation {OperationName} failed using model {Model} after {ElapsedMilliseconds} ms. Failure: {FailureKind}; provider status: {ProviderStatusCode}.",
            operationName,
            _options.Model,
            elapsedMilliseconds,
            exception.FailureKind,
            exception.ProviderStatusCode
        );
    }
}
