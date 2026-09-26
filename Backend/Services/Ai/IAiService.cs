namespace Backend.Services.Ai;

public interface IAiService
{
    Task<TResponse> GenerateStructuredAsync<TResponse>(
        AiGenerationRequest request,
        CancellationToken cancellationToken = default
    );
}
