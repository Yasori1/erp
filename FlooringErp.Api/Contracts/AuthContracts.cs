namespace FlooringErp.Api.Contracts;

public sealed record LoginRequest(string TenantSlug, string Email, string Password);
public sealed record LoginResponse(string AccessToken, DateTime ExpiresAtUtc, UserSummary User);
public sealed record UserSummary(Guid Id, string Email, string DisplayName, string Role, IReadOnlyCollection<string> Permissions);
