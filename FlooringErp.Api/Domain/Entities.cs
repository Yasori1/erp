using System.ComponentModel.DataAnnotations;

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
    public Tenant? Tenant { get; set; }
}

public sealed class RoleDefinition : TenantEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Permissions { get; set; } = string.Empty;
    public bool IsSystemRole { get; set; } = true;
    public Tenant? Tenant { get; set; }
}

public sealed class PendingAccountChange : TenantEntity
{
    public Guid UserId { get; set; }
    public string? RequestedEmail { get; set; }
    public string? RequestedDisplayName { get; set; }
    public string? RequestedPasswordHash { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime? ReviewedAtUtc { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public AppUser User { get; set; } = null!;
}

public sealed class Customer : TenantEntity
{
    [Required]
    public string CompanyName { get; set; } = string.Empty;

    [Required]
    public string ContactName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Phone { get; set; } = string.Empty;
    public string Status { get; set; } = "Lead";
    public Tenant? Tenant { get; set; }
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
}

public sealed class Project : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public decimal AreaM2 { get; set; }
    public string Status { get; set; } = "Discovery";
    public Tenant? Tenant { get; set; }
    public Customer Customer { get; set; } = null!;
}

public sealed class ProductSystem : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string LayersJson { get; set; } = "[]";
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public Tenant? Tenant { get; set; }
}

public sealed class Quote : TenantEntity
{
    public string QuoteNumber { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string ProductSystemName { get; set; } = string.Empty;
    public decimal AreaM2 { get; set; }
    public decimal Total { get; set; }
    public decimal EstimateLow { get; set; }
    public decimal EstimateHigh { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IncludeShipping { get; set; }
    public bool IncludeLabor { get; set; }
    public decimal MarginPercent { get; set; }
    public string Currency { get; set; } = "TRY";
    public string Status { get; set; } = "Draft";
    public string? LockedByUserId { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public bool RequiresManagementApproval { get; set; }
    public string ApprovalStatus { get; set; } = "NotRequired";
    public Tenant? Tenant { get; set; }
    public Customer? Customer { get; set; }
    public AppUser? AssignedToUser { get; set; }
}
