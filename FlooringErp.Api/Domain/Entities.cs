namespace FlooringErp.Api.Domain;

public abstract class TenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class AppUser : TenantEntity
{
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; }
    public DateTime? LockoutEndUtc { get; set; }
    public string Role { get; set; } = "Sales";
    public string Permissions { get; set; } = string.Empty;
    public decimal ApprovalAreaLimitM2 { get; set; } = 1000;
    public decimal ApprovalForeignCurrencyLimit { get; set; } = 1000;
}

public sealed class RoleDefinition : TenantEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Permissions { get; set; } = string.Empty;
    public bool IsSystemRole { get; set; } = true;
}

public sealed class Customer : TenantEntity
{
    public string CompanyName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Status { get; set; } = "Lead";
}

public sealed class Project : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public decimal AreaM2 { get; set; }
    public string Status { get; set; } = "Discovery";
}

public sealed class ProductSystem : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string LayersJson { get; set; } = "[]";
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

public sealed class Quote : TenantEntity
{
    public string QuoteNumber { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string ProductSystemName { get; set; } = string.Empty;
    public decimal AreaM2 { get; set; }
    public decimal Total { get; set; }
    public decimal MarginPercent { get; set; }
    public string Currency { get; set; } = "TRY";
    public string Status { get; set; } = "Draft";
    public string? LockedByUserId { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public bool RequiresManagementApproval { get; set; }
    public string ApprovalStatus { get; set; } = "NotRequired";
}
