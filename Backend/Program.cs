using Backend.DAL;
using Backend.Middleware;
using Backend.Services;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCorsPolicy";

// Loads the Firebase Admin credentials path from User Secrets
// and initializes the Firebase Admin SDK when the application starts.
var firebaseCredentialsPath =
    builder.Configuration["Firebase:CredentialsPath"];

if (string.IsNullOrWhiteSpace(firebaseCredentialsPath))
{
    throw new InvalidOperationException(
        "Missing Firebase credentials path."
    );
}

FirebaseApp.Create(new AppOptions
{
    Credential = GoogleCredential.FromFile(firebaseCredentialsPath)
});

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddScoped<DbService>();
builder.Services.AddScoped<FirebaseAuthService>();

builder.Services.AddMemoryCache();

builder.Services.AddHttpClient<ICountryService, CountryService>(client =>
{
    client.BaseAddress = new Uri(
        "https://api.restcountries.com/"
    );

    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<ICityService, CityService>(client =>
{
    client.BaseAddress = new Uri(
        "http://geodb-free-service.wirefreethought.com/"
    );

    client.Timeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Adds OpenAPI/Swagger support and configures an Authorization header.
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer(
        (document, context, cancellationToken) =>
        {
            document.Components ??= new OpenApiComponents();

            document.Components.SecuritySchemes ??=
                new Dictionary<string, OpenApiSecurityScheme>();

            document.Components.SecuritySchemes["Bearer"] =
                new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.ApiKey,
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Description =
                        "Enter your Firebase ID token in this format: Bearer {token}"
                };

            foreach (var path in document.Paths.Values)
            {
                foreach (var operation in path.Operations.Values)
                {
                    operation.Security ??=
                        new List<OpenApiSecurityRequirement>();

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
                                            Id = "Bearer"
                                        }
                                }
                            ] = Array.Empty<string>()
                        }
                    );
                }
            }

            return Task.CompletedTask;
        }
    );
});

var app = builder.Build();

// Global exception handling should run early in the request pipeline.
app.UseMiddleware<GlobalExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/openapi/v1.json",
            "Travel Planner API v1"
        );
    });
}

app.UseHttpsRedirection();

app.UseCors(FrontendCorsPolicy);

app.UseAuthorization();

app.MapControllers();

app.Run();