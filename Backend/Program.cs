using Backend.DAL;
using Backend.Middleware;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

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

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Global exception handling should run early in the request pipeline.
app.UseMiddleware<GlobalExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Travel Planner API v1");
    });
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();