using System.Security.Claims;
using FlooringErp.Api.Contracts;
using FlooringErp.Api.Domain;
using FlooringErp.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlooringErp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/management")]
public sealed class ManagementController(AppDbContext db) : ControllerBase
{
    [HttpGet("account-change-requests")]
    public async Task<ActionResult<IReadOnlyList<AccountChangeRequestResponse>>> AccountChangeRequests(CancellationToken cancellationToken)
    {
        if (!IsManagementUser()) return Forbid();

        var requests = await db.PendingAccountChanges.AsNoTracking()
            .Where(item => item.Status == "Pending")
            .OrderBy(item => item.CreatedAtUtc)
            .Select(item => new AccountChangeRequestResponse(
                item.Id,
                item.UserId,
                item.User.Email,
                item.User.DisplayName,
                item.RequestedEmail,
                item.RequestedDisplayName,
                item.RequestedPasswordHash != null,
                item.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        return Ok(requests);
    }

    [HttpPost("account-change-requests/{id:guid}/approve")]
    public async Task<IActionResult> ApproveAccountChange(Guid id, CancellationToken cancellationToken)
    {
        if (!IsManagementUser()) return Forbid();

        var request = await db.PendingAccountChanges
            .Include(item => item.User)
            .SingleOrDefaultAsync(item => item.Id == id && item.Status == "Pending", cancellationToken);
        if (request is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.RequestedEmail))
        {
            var emailInUse = await db.Users.AnyAsync(
                item => item.Id != request.UserId && item.Email == request.RequestedEmail,
                cancellationToken);
            if (emailInUse) return Conflict(new { message = "Talep edilen e-posta başka bir hesapta kullanılıyor." });
            request.User.Email = request.RequestedEmail;
        }

        if (request.RequestedDisplayName is not null)
        {
            request.User.DisplayName = request.RequestedDisplayName;
        }

        if (request.RequestedPasswordHash is not null)
        {
            request.User.PasswordHash = request.RequestedPasswordHash;
        }

        request.Status = "Approved";
        request.ReviewedAtUtc = DateTime.UtcNow;
        request.ReviewedByUserId = CurrentUserId();
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("account-change-requests/{id:guid}/reject")]
    public async Task<IActionResult> RejectAccountChange(Guid id, CancellationToken cancellationToken)
    {
        if (!IsManagementUser()) return Forbid();

        var request = await db.PendingAccountChanges
            .SingleOrDefaultAsync(item => item.Id == id && item.Status == "Pending", cancellationToken);
        if (request is null) return NotFound();

        request.Status = "Rejected";
        request.ReviewedAtUtc = DateTime.UtcNow;
        request.ReviewedByUserId = CurrentUserId();
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("roles")]
    [Authorize(Policy = "users.manage")]
    public async Task<ActionResult<IReadOnlyList<RoleDefinitionResponse>>> Roles(CancellationToken cancellationToken)
    {
        // Policy bu alana erişimi denetliyor, doğrudan forbbiden'ı skip ediyoruz
        var roles = await db.RoleDefinitions.AsNoTracking().OrderBy(item => item.Name).ToListAsync(cancellationToken);
        return Ok(roles.Select(ToResponse).ToList());
    }

    [HttpGet("roles/{code}")]
    [Authorize(Policy = "users.manage")]
    public async Task<ActionResult<RoleDefinitionResponse>> RoleByCode(string code, CancellationToken cancellationToken)
    {
        var role = await db.RoleDefinitions.AsNoTracking().SingleOrDefaultAsync(item => item.Code == code, cancellationToken);
        return role is null ? NotFound() : Ok(ToResponse(role));
    }

    [HttpPost("roles")]
    public async Task<ActionResult<RoleDefinitionResponse>> CreateRole(CreateRoleRequest request, CancellationToken cancellationToken)
    {
        if (!CanManageUsers()) return Forbid();
        if (!HasKnownPermissions(request.Permissions))
        {
            return BadRequest(new { message = "Rol yalnızca tanımlı izinleri içerebilir." });
        }

        var role = new RoleDefinition
        {
            Code = $"custom-{Guid.NewGuid():N}",
            Name = request.Name.Trim(),
            Permissions = string.Join(',', request.Permissions.Distinct(StringComparer.OrdinalIgnoreCase)),
            IsSystemRole = false
        };
        db.RoleDefinitions.Add(role);
        await db.SaveChangesAsync(cancellationToken);
        var response = ToResponse(role);
        return CreatedAtAction(nameof(RoleByCode), new { code = role.Code }, response);
    }

    [HttpGet("users")]
    [Authorize(Policy = "users.manage")]
    public async Task<ActionResult<IReadOnlyList<ManagedUserResponse>>> Users(CancellationToken cancellationToken)
    {
        var users = await db.Users.AsNoTracking().OrderBy(item => item.DisplayName).ToListAsync(cancellationToken);
        return Ok(users.Select(ToResponse).ToList());
    }

    [HttpPut("roles/{code}/permissions")]
    [Authorize(Policy = "users.manage")]
    public async Task<ActionResult<RoleDefinitionResponse>> UpdateRolePermissions(string code, UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
    {
        var role = await db.RoleDefinitions.SingleOrDefaultAsync(item => item.Code == code, cancellationToken);
        if (role is null) return NotFound();
        if (role.Code == "FounderGeneralManager")
        {
            return Conflict(new { message = "Kurucu rolünün yetkileri değiştirilemez." });
        }
        if (!HasKnownPermissions(request.Permissions))
        {
            return BadRequest(new { message = "Rol yalnızca tanımlı izinleri içerebilir." });
        }

        role.Permissions = string.Join(',', request.Permissions.Distinct(StringComparer.OrdinalIgnoreCase));
        var assignedUsers = await db.Users.Where(item => item.Role == role.Code).ToListAsync(cancellationToken);
        foreach (var user in assignedUsers)
        {
            user.Permissions = role.Permissions;
        }
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToResponse(role));
    }

    [HttpPut("users/{id:guid}/role")]
    [Authorize(Policy = "users.manage")]
    public async Task<ActionResult<ManagedUserResponse>> AssignRole(Guid id, AssignUserRoleRequest request, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (user is null) return NotFound();
        if (user.Role == "FounderGeneralManager")
        {
            return Conflict(new { message = "Kurucu hesabının rolü değiştirilemez." });
        }

        var role = await db.RoleDefinitions.SingleOrDefaultAsync(item => item.Code == request.RoleCode, cancellationToken);
        if (role is null) return NotFound(new { message = "Seçilen rol bulunamadı." });
        if (role.Code == "FounderGeneralManager")
        {
            return BadRequest(new { message = "Kurucu rolü başka kullanıcılara atanamaz." });
        }

        user.Role = role.Code;
        user.Permissions = role.Permissions;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToResponse(user));
    }

    [HttpPut("users/{id:guid}/approval-limits")]
    [Authorize(Policy = "users.manage")]
    public async Task<IActionResult> UpdateApprovalLimits(Guid id, UpdateApprovalLimitsRequest request, CancellationToken cancellationToken)
    {
        if (request.AreaLimitM2 < 0 || request.ForeignCurrencyLimit < 0) return BadRequest(new { message = "Onay limitleri negatif olamaz." });
        var user = await db.Users.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (user is null) return NotFound();
        user.ApprovalAreaLimitM2 = request.AreaLimitM2;
        user.ApprovalForeignCurrencyLimit = request.ForeignCurrencyLimit;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private bool CanManageUsers() => User.IsInRole("Admin") || User.IsInRole("FounderGeneralManager") ||
        User.Claims.Any(item => item.Type == "permission" && item.Value == "users.manage");

    private bool IsManagementUser() => CanManageUsers();

    private Guid? CurrentUserId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id)
            ? id
            : null;

    private static bool HasKnownPermissions(IEnumerable<string> permissions) =>
        permissions.All(ManagementPermissionCatalog.All.Contains);

    private static ManagedUserResponse ToResponse(AppUser user) => new(
        user.Id,
        user.Email,
        user.DisplayName,
        user.Role,
        user.IsActive,
        user.ApprovalAreaLimitM2,
        user.ApprovalForeignCurrencyLimit);

    private static RoleDefinitionResponse ToResponse(RoleDefinition role) => new(
        role.Id,
        role.Code,
        role.Name,
        role.Permissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
        role.IsSystemRole);
}
