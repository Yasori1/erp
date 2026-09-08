using System.Security.Claims;
using FlooringErp.Api.Contracts;
using FlooringErp.Api.Infrastructure;
using FlooringErp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlooringErp.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    AppDbContext db,
    IPasswordHasher<FlooringErp.Api.Domain.AppUser> passwordHasher,
    JwtTokenService tokenService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var tenant = await db.Tenants.AsNoTracking().SingleOrDefaultAsync(
            item => item.Slug == request.TenantSlug.Trim().ToLowerInvariant() && item.IsActive,
            cancellationToken);
        var user = tenant is null
            ? null
            : await db.Users.IgnoreQueryFilters().SingleOrDefaultAsync(
                item => item.TenantId == tenant.Id && item.Email == request.Email.Trim().ToLowerInvariant(),
                cancellationToken);

        if (user is null || !user.IsActive || user.IsLocked ||
            (user.LockoutEndUtc is not null && user.LockoutEndUtc > DateTime.UtcNow))
        {
            return Unauthorized(new { message = "E-posta veya şifre geçersiz." });
        }

        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "E-posta veya şifre geçersiz." });
        }

        var (accessToken, expiresAtUtc) = tokenService.Create(user);
        var permissions = user.Permissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return Ok(new LoginResponse(
            accessToken,
            expiresAtUtc,
            new UserSummary(user.Id, user.Email, user.DisplayName, user.Role, permissions)));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserSummary>> Me(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userId, out var id))
        {
            return Unauthorized();
        }

        var user = await db.Users.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(new UserSummary(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role,
            user.Permissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)));
    }
}
