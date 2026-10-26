using System.ComponentModel.DataAnnotations;

namespace FlooringErp.Api.Contracts;

/// <summary>A tenant role and the permissions granted by that role.</summary>
public sealed record RoleDefinitionResponse(Guid Id, string Code, string Name, IReadOnlyCollection<string> Permissions, bool IsSystemRole);

/// <summary>Payload for creating a tenant-scoped role.</summary>
public sealed record CreateRoleRequest
{
	[Required, StringLength(80, MinimumLength = 2)]
	public required string Name { get; init; }

	[Required]
	public required IReadOnlyCollection<string> Permissions { get; init; }
}

/// <summary>Payload for replacing a role's permission set.</summary>
public sealed record UpdateRolePermissionsRequest
{
	[Required]
	public required IReadOnlyCollection<string> Permissions { get; init; }
}

/// <summary>Payload for assigning a tenant role to an existing user.</summary>
public sealed record AssignUserRoleRequest
{
	[Required, StringLength(80, MinimumLength = 1)]
	public required string RoleCode { get; init; }
}

/// <summary>A user visible to tenant administrators.</summary>
public sealed record ManagedUserResponse(
	Guid Id,
	string Email,
	string DisplayName,
	string Role,
	bool IsActive,
	decimal ApprovalAreaLimitM2,
	decimal ApprovalForeignCurrencyLimit);

/// <summary>Payload for changing a user's quote approval limits.</summary>
public sealed record UpdateApprovalLimitsRequest(decimal AreaLimitM2, decimal ForeignCurrencyLimit);

public static class ManagementPermissionCatalog
{
	public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
	{
		"workspace.read",
		"customers.read", "customers.write",
		"quotes.read", "quotes.read.all", "quotes.write", "quotes.approve",
		"projects.read",
		"products.read", "products.write",
		"stock.read", "stock.write",
		"rates.read",
		"analytics.read",
		"easyquote.use",
		"discounts.manage",
		"settings.manage",
		"users.manage"
	};
}
