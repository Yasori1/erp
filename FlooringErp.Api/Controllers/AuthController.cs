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
        var roleName = await db.RoleDefinitions.IgnoreQueryFilters()
            .Where(item => item.TenantId == tenant!.Id && item.Code == user.Role)
            .Select(item => item.Name)
            .SingleOrDefaultAsync(cancellationToken) ?? user.Role;
        return Ok(new LoginResponse(
            accessToken,
            expiresAtUtc,
            new UserSummary(user.Id, user.Email, user.DisplayName, user.Role, roleName, permissions)));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserSummary>> Me(CancellationToken cancellationToken)
    {
        var user = await CurrentUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(await ToUserSummaryAsync(user, cancellationToken));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<AccountChangeSubmissionResponse>> UpdateProfile(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var user = await CurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var email = request.Email.Trim().ToLowerInvariant();
        if (await EmailInUseAsync(user, email, cancellationToken))
        {
            return Conflict(new { message = "Bu e-posta adresi başka bir hesapta kullanılıyor." });
        }

        if (!IsManagementUser())
        {
            if (await HasPendingRequestAsync(user.Id, cancellationToken))
            {
                return Conflict(new { message = "Bekleyen hesap değişikliği talebiniz sonuçlanmadan yeni talep oluşturamazsınız." });
            }

            db.PendingAccountChanges.Add(new FlooringErp.Api.Domain.PendingAccountChange
            {
                UserId = user.Id,
                RequestedEmail = email,
                RequestedDisplayName = request.DisplayName.Trim()
            });
            await db.SaveChangesAsync(cancellationToken);
            return Accepted(new AccountChangeSubmissionResponse(null, true, "Profil değişikliği yönetici onayına gönderildi."));
        }

        user.Email = email;
        user.DisplayName = request.DisplayName.Trim();
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new AccountChangeSubmissionResponse(await ToUserSummaryAsync(user, cancellationToken), false, "Profil bilgileri güncellendi."));
    }

    [Authorize]
    [HttpPut("change-password")]
    public async Task<ActionResult<AccountChangeSubmissionResponse>> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await CurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        if (passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword) == PasswordVerificationResult.Failed)
        {
            return BadRequest(new { message = "Mevcut şifre yanlış." });
        }

        if (request.CurrentPassword == request.NewPassword)
        {
            return BadRequest(new { message = "Yeni şifre mevcut şifreden farklı olmalıdır." });
        }

        var newPasswordHash = passwordHasher.HashPassword(user, request.NewPassword);
        if (!IsManagementUser())
        {
            if (await HasPendingRequestAsync(user.Id, cancellationToken))
            {
                return Conflict(new { message = "Bekleyen hesap değişikliği talebiniz sonuçlanmadan yeni talep oluşturamazsınız." });
            }

            db.PendingAccountChanges.Add(new FlooringErp.Api.Domain.PendingAccountChange
            {
                UserId = user.Id,
                RequestedPasswordHash = newPasswordHash
            });
            await db.SaveChangesAsync(cancellationToken);
            return Accepted(new AccountChangeSubmissionResponse(null, true, "Şifre değişikliği yönetici onayına gönderildi."));
        }

        user.PasswordHash = newPasswordHash;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new AccountChangeSubmissionResponse(null, false, "Şifreniz değiştirildi."));
    }

    private async Task<FlooringErp.Api.Domain.AppUser?> CurrentUserAsync(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(userId, out var id)
            ? await db.Users.SingleOrDefaultAsync(item => item.Id == id, cancellationToken)
            : null;
    }

    private async Task<UserSummary> ToUserSummaryAsync(FlooringErp.Api.Domain.AppUser user, CancellationToken cancellationToken)
    {
        var roleName = await db.RoleDefinitions.AsNoTracking()
            .Where(item => item.Code == user.Role)
            .Select(item => item.Name)
            .SingleOrDefaultAsync(cancellationToken) ?? user.Role;

        return new UserSummary(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role,
            roleName,
            user.Permissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }

    private bool IsManagementUser() =>
        User.IsInRole("Admin") || User.IsInRole("FounderGeneralManager") ||
        User.Claims.Any(item => item.Type == "permission" && item.Value == "users.manage");

    private Task<bool> EmailInUseAsync(FlooringErp.Api.Domain.AppUser user, string email, CancellationToken cancellationToken) =>
        db.Users.AnyAsync(item => item.Id != user.Id && item.Email == email, cancellationToken);

    private Task<bool> HasPendingRequestAsync(Guid userId, CancellationToken cancellationToken) =>
        db.PendingAccountChanges.AnyAsync(item => item.UserId == userId && item.Status == "Pending", cancellationToken);
}
