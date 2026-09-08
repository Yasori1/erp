namespace FlooringErp.Api.Contracts;

public sealed record RoleDefinitionResponse(Guid Id, string Code, string Name, IReadOnlyCollection<string> Permissions);
public sealed record UpdateRolePermissionsRequest(IReadOnlyCollection<string> Permissions);
public sealed record UpdateApprovalLimitsRequest(decimal AreaLimitM2, decimal ForeignCurrencyLimit);
