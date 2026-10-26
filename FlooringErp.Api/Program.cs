using System.Text;
using FlooringErp.Api.Infrastructure;
using FlooringErp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);
var jwtSecret = builder.Configuration["Jwt:Secret"];
var connectionString = builder.Configuration.GetConnectionString("Default");

if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
{
    throw new InvalidOperationException("Jwt:Secret must be supplied through environment configuration and be at least 32 characters.");
}

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:Default must be supplied through environment configuration.");
}

try
{
    _ = new MySqlConnectionStringBuilder(connectionString);
}
catch (ArgumentException exception)
{
    throw new InvalidOperationException(
        "ConnectionStrings:Default is not a valid MySQL connection string. Use key/value pairs such as Server=localhost;Port=3306;Database=flooring_erp;User=root;Password=...;",
        exception);
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantContext, TenantContext>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<QuoteApprovalService>();
builder.Services.AddScoped<Microsoft.AspNetCore.Identity.IPasswordHasher<FlooringErp.Api.Domain.AppUser>, Microsoft.AspNetCore.Identity.PasswordHasher<FlooringErp.Api.Domain.AppUser>>();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 36))));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddPolicy("LocalWeb", policy =>
    policy.WithOrigins("http://127.0.0.1:5173", "http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));
builder.Services.AddControllers();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseCors("LocalWeb");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (builder.Configuration.GetValue<bool>("Hutec:SeedDevelopmentData"))
{
    await DevelopmentSeeder.SeedAsync(app.Services, builder.Configuration);
}

app.Run();
