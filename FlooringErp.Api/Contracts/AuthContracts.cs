using System.ComponentModel.DataAnnotations;

namespace FlooringErp.Api.Contracts;

public sealed record LoginRequest(string TenantSlug, string Email, string Password);
public sealed record LoginResponse(string AccessToken, DateTime ExpiresAtUtc, UserSummary User);
public sealed record UserSummary(Guid Id, string Email, string DisplayName, string Role, string RoleName, IReadOnlyCollection<string> Permissions);

public sealed record UpdateProfileRequest
{
    [Required, StringLength(120, MinimumLength = 2)]
    public required string DisplayName { get; init; }

    [Required, EmailAddress, StringLength(255)]
    public required string Email { get; init; }
}

public sealed record ChangePasswordRequest
{
    [Required]
    public required string CurrentPassword { get; init; }

    [Required, StringLength(128, MinimumLength = 8)]
    public required string NewPassword { get; init; }
}

public sealed record AccountChangeRequestResponse(
    Guid Id,
    Guid UserId,
    string CurrentEmail,
    string CurrentDisplayName,
    string? RequestedEmail,
    string? RequestedDisplayName,
    bool HasPasswordChange,
    DateTime RequestedAtUtc);

public sealed record AccountChangeSubmissionResponse(UserSummary? User, bool ApprovalRequired, string Message);
