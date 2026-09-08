namespace FlooringErp.Api.Services;

public sealed class QuoteApprovalService(IConfiguration configuration)
{
    public bool RequiresManagementApproval(decimal areaM2, decimal total, string currency, decimal? areaLimitM2 = null, decimal? foreignCurrencyLimit = null)
    {
        var areaThreshold = areaLimitM2 ?? configuration.GetValue("QuoteApproval:AreaThresholdM2", 1000m);
        var foreignCurrencyThreshold = foreignCurrencyLimit ?? configuration.GetValue("QuoteApproval:ForeignCurrencyThreshold", 1000m);

        return areaM2 > areaThreshold ||
            ((currency.Equals("USD", StringComparison.OrdinalIgnoreCase) ||
              currency.Equals("EUR", StringComparison.OrdinalIgnoreCase)) && total >= foreignCurrencyThreshold);
    }
}