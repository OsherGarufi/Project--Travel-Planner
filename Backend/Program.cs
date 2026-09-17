using Backend.DAL;
using Backend.Middleware;
using Backend.Services;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.OpenApi.Models;

var builder =
    WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy =
    "FrontendCorsPolicy";

// Loads the Firebase Admin credentials path from User Secrets
// and initializes the Firebase Admin SDK when the application starts.
var firebaseCredentialsPath =
    builder.Configuration[
        "Firebase:CredentialsPath"
    ];

if (
    string.IsNullOrWhiteSpace(
        firebaseCredentialsPath
    )
)
{
    throw new InvalidOperationException(
        "Missing Firebase credentials path."
    );
}

FirebaseApp.Create(
    new AppOptions
    {
        Credential =
            CredentialFactory
                .FromFile<ServiceAccountCredential>(
                    firebaseCredentialsPath
                )
                .ToGoogleCredential()
    }
);

// Reads allowed frontend origins from configuration.
// Multiple origins can be separated by commas.
var configuredOrigins =
    builder.Configuration[
        "Cors:AllowedOrigins"
    ];

var allowedOrigins =
    string.IsNullOrWhiteSpace(
        configuredOrigins
    )
        ? Array.Empty<string>()
        : configuredOrigins
            .Split(
                ',',
                StringSplitOptions
                    .RemoveEmptyEntries
                | StringSplitOptions
                    .TrimEntries
            )
            .Select(
                origin =>
                    origin.TrimEnd('/')
            )
            .Distinct(
                StringComparer.OrdinalIgnoreCase
            )
            .ToArray();

// Local Vite frontend is allowed automatically in Development.
if (
    builder.Environment
        .IsDevelopment()
)
{
    allowedOrigins =
        allowedOrigins
            .Append(
                "http://localhost:5173"
            )
            .Distinct(
                StringComparer.OrdinalIgnoreCase
            )
            .ToArray();
}

// Production must explicitly define at least one allowed frontend.
if (
    builder.Environment
        .IsProduction()
    && allowedOrigins.Length == 0
)
{
    throw new InvalidOperationException(
        "Missing CORS allowed origins."
    );
}

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<DbService>();
builder.Services.AddScoped<ExpenseDbService>();
builder.Services.AddScoped<ItineraryDbService>();
builder.Services.AddScoped<ItineraryExpenseService>();
builder.Services.AddScoped<TripService>();
builder.Services.AddScoped<FirebaseAuthService>();
builder.Services.AddScoped<CurrentUserService>();

builder.Services.AddMemoryCache();

builder.Services.AddHttpClient<
    ICountryService,
    CountryService
>(
    client =>
    {
        client.BaseAddress =
            new Uri(
                "https://api.restcountries.com/"
            );

        client.Timeout =
            TimeSpan.FromSeconds(30);
    }
);

builder.Services.AddHttpClient<
    ICityService,
    CityService
>(
    client =>
    {
        client.BaseAddress =
            new Uri(
                "http://geodb-free-service.wirefreethought.com/"
            );

        client.Timeout =
            TimeSpan.FromSeconds(15);
    }
);

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            FrontendCorsPolicy,
            policy =>
            {
                policy
                    .WithOrigins(
                        allowedOrigins
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            }
        );
    }
);

// Adds OpenAPI/Swagger support and configures an Authorization header.
builder.Services.AddOpenApi(
    options =>
    {
        options.AddDocumentTransformer(
            (
                document,
                context,
                cancellationToken
            ) =>
            {
                document.Components ??=
                    new OpenApiComponents();

                document.Components
                    .SecuritySchemes ??=
                    new Dictionary<
                        string,
                        OpenApiSecurityScheme
                    >();

                document.Components
                    .SecuritySchemes[
                        "Bearer"
                    ] =
                    new OpenApiSecurityScheme
                    {
                        Type =
                            SecuritySchemeType
                                .ApiKey,

                        Name =
                            "Authorization",

                        In =
                            ParameterLocation
                                .Header,

                        Description =
                            "Enter your Firebase ID token in this format: Bearer {token}"
                    };

                foreach (
                    var path
                    in document.Paths.Values
                )
                {
                    foreach (
                        var operation
                        in path.Operations.Values
                    )
                    {
                        operation.Security ??=
                            new List<
                                OpenApiSecurityRequirement
                            >();

                        operation.Security.Add(
                            new OpenApiSecurityRequirement
                            {
                                [
                                    new OpenApiSecurityScheme
                                    {
                                        Reference =
                                            new OpenApiReference
                                            {
                                                Type =
                                                    ReferenceType
                                                        .SecurityScheme,

                                                Id =
                                                    "Bearer"
                                            }
                                    }
                                ] =
                                    Array.Empty<string>()
                            }
                        );
                    }
                }

                return Task.CompletedTask;
            }
        );
    }
);

var app = builder.Build();

// Global exception handling should run early in the request pipeline.
app.UseMiddleware<
    GlobalExceptionMiddleware
>();

// Configure the HTTP request pipeline.
if (
    app.Environment
        .IsDevelopment()
)
{
    app.MapOpenApi();

    app.UseSwaggerUI(
        options =>
        {
            options.SwaggerEndpoint(
                "/openapi/v1.json",
                "Travel Planner API v1"
            );
        }
    );
}

if (
    app.Environment
        .IsDevelopment()
)
{
    app.UseHttpsRedirection();
}

app.UseCors(
    FrontendCorsPolicy
);

app.UseAuthorization();

app.MapControllers();

app.Run();