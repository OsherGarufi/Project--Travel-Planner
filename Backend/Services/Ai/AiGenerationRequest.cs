using System.Text.Json.Nodes;

namespace Backend.Services.Ai;

public sealed record AiGenerationRequest(
    string SystemInstruction,
    string Content,
    JsonNode ResponseJsonSchema,
    string? OperationName = null
);
