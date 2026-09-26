namespace Backend.Services.Ai;

public enum AiFailureKind
{
    RateLimited,
    TemporarilyUnavailable,
    TimedOut,
    Blocked,
    EmptyResponse,
    MalformedResponse,
    InvalidStructuredOutput,
    ProviderRejectedRequest
}

public sealed class AiServiceException : Exception
{
    public AiFailureKind FailureKind { get; }

    public int? ProviderStatusCode { get; }

    public AiServiceException(
        AiFailureKind failureKind,
        string message,
        int? providerStatusCode = null,
        Exception? innerException = null
    )
        : base(message, innerException)
    {
        FailureKind = failureKind;
        ProviderStatusCode = providerStatusCode;
    }
}
