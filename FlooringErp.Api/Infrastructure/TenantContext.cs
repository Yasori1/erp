using System.Security.Claims;

namespace FlooringErp.Api.Infrastructure;

public interface ITenantContext
{
    Guid TenantId { get; }
    bool HasTenant { get; }
}

public sealed class TenantContext(IHttpContextAccessor httpContextAccessor) : ITenantContext
{
    public bool HasTenant => Guid.TryParse(
        httpContextAccessor.HttpContext?.User.FindFirstValue("tenant_id"), out _);

    public Guid TenantId => Guid.TryParse(
        httpContextAccessor.HttpContext?.User.FindFirstValue("tenant_id"), out var tenantId)
        ? tenantId
        : throw new InvalidOperationException("Authenticated request has no tenant claim.");
}
