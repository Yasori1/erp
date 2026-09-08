using FlooringErp.Api.Domain;
using FlooringErp.Api.Contracts;
using FlooringErp.Api.Infrastructure;
using FlooringErp.Api.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlooringErp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/workspace")]
public sealed class WorkspaceController(
    AppDbContext db,
    ITenantContext tenantContext,
    QuoteApprovalService quoteApprovalService) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<object>> Summary(CancellationToken cancellationToken)
    {
        if (!HasPermission("workspace.read")) return Forbid();
        var customerCount = await db.Customers.CountAsync(cancellationToken);
        var projectCount = await db.Projects.CountAsync(cancellationToken);
        var quoteCount = await db.Quotes.CountAsync(cancellationToken);
        var pipelineValue = await db.Quotes.Where(item => item.Status != "Rejected")
            .SumAsync(item => (decimal?)item.Total, cancellationToken) ?? 0;

        return Ok(new
        {
            tenantId = tenantContext.TenantId,
            customerCount,
            projectCount,
            quoteCount,
            pipelineValue
        });
    }

    [HttpGet("customers")]
    public async Task<ActionResult<IReadOnlyList<Customer>>> Customers(CancellationToken cancellationToken)
    {
        if (!HasPermission("customers.read")) return Forbid();
        return Ok(await db.Customers.AsNoTracking().OrderByDescending(item => item.CreatedAtUtc).ToListAsync(cancellationToken));
    }

    [HttpPost("customers")]
    public async Task<ActionResult<Customer>> CreateCustomer(Customer customer, CancellationToken cancellationToken)
    {
        if (!HasPermission("customers.write")) return Forbid();
        customer.Id = Guid.NewGuid();
        db.Customers.Add(customer);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Customers), new { id = customer.Id }, customer);
    }

    [HttpGet("quotes")]
    public async Task<ActionResult<IReadOnlyList<QuoteResponse>>> Quotes(CancellationToken cancellationToken)
    {
        if (!HasPermission("quotes.read")) return Forbid();

        var query = db.Quotes.AsNoTracking();
        if (!User.IsInRole("Admin"))
        {
            var currentUserId = CurrentUserId();
            if (currentUserId is null) return Unauthorized();
            query = query.Where(item => item.AssignedToUserId == currentUserId);
        }

        var quotes = (await query.OrderByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken))
            .Select(ToResponse)
            .ToList();
        return Ok(quotes);
    }

    [HttpPost("quotes")]
    public async Task<ActionResult<QuoteResponse>> CreateQuote(CreateQuoteRequest request, CancellationToken cancellationToken)
    {
        if (!HasPermission("quotes.write")) return Forbid();

        var currentUserId = CurrentUserId();
        if (currentUserId is null) return Unauthorized();

        var assignedToUserId = IsManagement() && request.AssignedToUserId.HasValue
            ? request.AssignedToUserId
            : currentUserId;
        var approvalUser = await db.Users.SingleOrDefaultAsync(item => item.Id == assignedToUserId, cancellationToken);
        var requiresApproval = quoteApprovalService.RequiresManagementApproval(
            request.AreaM2,
            request.Total,
            request.Currency,
            approvalUser?.ApprovalAreaLimitM2,
            approvalUser?.ApprovalForeignCurrencyLimit);

        var quote = new Quote
        {
            QuoteNumber = request.QuoteNumber.Trim(),
            CustomerId = request.CustomerId,
            ProductSystemName = request.ProductSystemName.Trim(),
            AreaM2 = request.AreaM2,
            Total = request.Total,
            MarginPercent = request.MarginPercent,
            Currency = request.Currency.ToUpperInvariant(),
            AssignedToUserId = assignedToUserId,
            RequiresManagementApproval = requiresApproval,
            ApprovalStatus = requiresApproval ? "Pending" : "NotRequired",
            Status = requiresApproval ? "PendingManagementApproval" : "Draft"
        };

        db.Quotes.Add(quote);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Quotes), new { id = quote.Id }, ToResponse(quote));
    }

    [HttpPost("quotes/{id:guid}/approve")]
    public async Task<ActionResult<QuoteResponse>> ApproveQuote(Guid id, CancellationToken cancellationToken)
    {
        if (!IsManagement() || !HasPermission("quotes.approve")) return Forbid();

        var quote = await db.Quotes.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (quote is null) return NotFound();

        quote.ApprovalStatus = "Approved";
        quote.Status = "Draft";
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToResponse(quote));
    }

    [HttpPost("easy-quote")]
    public async Task<ActionResult<EasyQuoteResponse>> EasyQuote(EasyQuoteRequest request, CancellationToken cancellationToken)
    {
        if (!HasPermission("easyquote.use")) return Forbid();
        if (request.AreaM2 <= 0) return BadRequest(new { message = "Alan 0'dan büyük olmalıdır." });

        var history = await db.Quotes.AsNoTracking()
            .Where(item => item.ProductSystemName == request.ProductSystemName && item.Currency == "TRY" && item.AreaM2 > 0 && item.Total > 0)
            .Select(item => new { item.Total, item.AreaM2 })
            .ToListAsync(cancellationToken);
        var averagePerM2 = history.Count > 0 ? history.Average(item => item.Total / item.AreaM2) : 660m;
        var locationFactor = request.Location.Equals("İstanbul", StringComparison.OrdinalIgnoreCase) ? 1.16m : request.Location.Equals("Manisa", StringComparison.OrdinalIgnoreCase) ? 1.08m : 1m;
        var shipping = request.IncludeShipping ? Math.Max(3500m, request.AreaM2 * 18m) : 0;
        var laborIncluded = request.IncludeLabor ? 0 : -(request.AreaM2 * averagePerM2 * .25m);
        var estimate = request.AreaM2 * averagePerM2 * locationFactor + shipping + laborIncluded;
        return Ok(new EasyQuoteResponse(Math.Round(estimate * .94m), Math.Round(estimate * 1.06m), Math.Round(averagePerM2 * locationFactor), history.Count, history.Count > 0));
    }

    private bool HasPermission(string permission) =>
        IsManagement() || User.Claims.Any(item => item.Type == "permission" && item.Value == permission);

    private bool IsManagement() => User.IsInRole("Admin") || User.IsInRole("FounderGeneralManager");

    private Guid? CurrentUserId() => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id)
        ? id
        : null;

    private static QuoteResponse ToResponse(Quote quote) => new(
        quote.Id,
        quote.QuoteNumber,
        quote.AreaM2,
        quote.Total,
        quote.Currency,
        quote.AssignedToUserId,
        quote.RequiresManagementApproval,
        quote.ApprovalStatus,
        quote.Status);
}
