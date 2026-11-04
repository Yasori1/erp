using System.ComponentModel.DataAnnotations;

namespace FlooringErp.Api.Contracts;

/// <summary>Payload for creating a tenant-scoped quote.</summary>
public sealed record CreateQuoteRequest
{
    [Required, MaxLength(40)]
    public required string QuoteNumber { get; init; }

    public Guid? CustomerId { get; init; }

    [MaxLength(120)]
    public string ProductSystemName { get; init; } = string.Empty;

    [Range(0, 100000000)]
    public decimal AreaM2 { get; init; }

    [Range(0, 1000000000)]
    public decimal Total { get; init; }

    [Range(0, 1000000000)]
    public decimal? EstimateLow { get; init; }

    [Range(0, 1000000000)]
    public decimal? EstimateHigh { get; init; }

    [MaxLength(120)]
    public string Location { get; init; } = string.Empty;

    public bool IncludeShipping { get; init; }

    public bool IncludeLabor { get; init; }

    [Range(0, 100)]
    public decimal MarginPercent { get; init; }

    [Required, RegularExpression("^(TRY|USD|EUR)$")]
    public required string Currency { get; init; }

    public Guid? AssignedToUserId { get; init; }
}

/// <summary>Represents a quote and its approval decision.</summary>
public sealed record QuoteResponse(
    Guid Id,
    string QuoteNumber,
    decimal AreaM2,
    decimal Total,
    string Currency,
    string ProductSystemName,
    decimal EstimateLow,
    decimal EstimateHigh,
    string Location,
    bool IncludeShipping,
    bool IncludeLabor,
    Guid? AssignedToUserId,
    bool RequiresManagementApproval,
    string ApprovalStatus,
    string Status);

/// <summary>Input for a historical-data quick estimate.</summary>
public sealed record EasyQuoteRequest
{
    [Required, MaxLength(120)]
    public required string ProductSystemName { get; init; }

    [Range(0.01, 100000000)]
    public decimal AreaM2 { get; init; }

    [Required, MaxLength(120)]
    public required string Location { get; init; }

    public bool IncludeShipping { get; init; }

    public bool IncludeLabor { get; init; }
}

public sealed record EasyQuoteResponse(decimal Low, decimal High, decimal AveragePerM2, int HistoricalQuoteCount, bool IsHistoricalDataAvailable);