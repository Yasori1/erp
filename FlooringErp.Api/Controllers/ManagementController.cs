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
    [HttpGet("roles")]
    public async Task<ActionResult<IReadOnlyList<RoleDefinitionResponse>>> Roles(CancellationToken cancellationToken)
    {
        if (!CanManageUsers()) return Forbid();
        var roles = await db.RoleDefinitions.AsNoTracking().OrderBy(item => item.Name).ToListAsync(cancellationToken);
        return Ok(roles.Select(ToResponse).ToList());
    }

    [HttpPut("roles/{code}/permissions")]
    public async Task<ActionResult<RoleDefinitionResponse>> UpdateRolePermissions(string code, UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
    {
        if (!CanManageUsers()) return Forbid();
        var role = await db.RoleDefinitions.SingleOrDefaultAsync(item => item.Code == code, cancellationToken);
        if (role is null) return NotFound();
        role.Permissions = string.Join(',', request.Permissions.Distinct(StringComparer.OrdinalIgnoreCase));
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToResponse(role));
    }

    [HttpPut("users/{id:guid}/approval-limits")]
    public async Task<IActionResult> UpdateApprovalLimits(Guid id, UpdateApprovalLimitsRequest request, CancellationToken cancellationToken)
    {
        if (!CanManageUsers()) return Forbid();
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

    private static RoleDefinitionResponse ToResponse(RoleDefinition role) => new(
        role.Id,
        role.Code,
        role.Name,
        role.Permissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
}
