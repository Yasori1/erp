using System.Security.Claims;
using FlooringErp.Api.Domain;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FlooringErp.Api.Infrastructure;

public static class DevelopmentSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        var adminPassword = configuration["Hutec:SeedAdminPassword"];
        var salesPassword = configuration["Hutec:SeedSalesPassword"];
        var fieldPassword = configuration["Hutec:SeedFieldPassword"];
        if (string.IsNullOrWhiteSpace(adminPassword) || string.IsNullOrWhiteSpace(salesPassword) || string.IsNullOrWhiteSpace(fieldPassword))
        {
            throw new InvalidOperationException("Development seed için Hutec:SeedAdminPassword, Hutec:SeedSalesPassword ve Hutec:SeedFieldPassword verilmelidir.");
        }

        using var scope = services.CreateScope();
        var httpContextAccessor = scope.ServiceProvider.GetRequiredService<IHttpContextAccessor>();
        var tenant = await scope.ServiceProvider.GetRequiredService<AppDbContext>().Tenants
            .SingleOrDefaultAsync(item => item.Slug == "artemis-proje");

        if (tenant is null)
        {
            tenant = new Tenant { Name = "Artemis Proje Zemin Sistemleri", Slug = "artemis-proje" };
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            context.Tenants.Add(tenant);
            await context.SaveChangesAsync();
        }

        httpContextAccessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim("tenant_id", tenant.Id.ToString()) }))
        };

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AppUser>>();
        await SeedRolesAsync(db, tenant.Id);
        await AddUserAsync(db, hasher, tenant.Id, "admin@artemisproje.com", "Kurucu Genel Müdür", "FounderGeneralManager", adminPassword, "workspace.read,customers.read,customers.write,quotes.read,quotes.write,quotes.approve,easyquote.use,users.manage");
        await AddUserAsync(db, hasher, tenant.Id, "satis@artemisproje.com", "Satış Temsilcisi", "Sales", salesPassword, "workspace.read,customers.read,quotes.read,quotes.write,easyquote.use");
        await AddUserAsync(db, hasher, tenant.Id, "saha@artemisproje.com", "Saha Personeli", "Field", fieldPassword, "workspace.read,customers.read,quotes.read,easyquote.use");
    }

    private static async Task SeedRolesAsync(AppDbContext db, Guid tenantId)
    {
        var roles = new[]
        {
            new RoleDefinition { TenantId = tenantId, Code = "FounderGeneralManager", Name = "Kurucu / Genel Müdür", Permissions = "customers.read,customers.write,quotes.read,quotes.write,quotes.approve,products.read,products.write,stock.read,stock.write,analytics.read,users.manage" },
            new RoleDefinition { TenantId = tenantId, Code = "SalesManager", Name = "Satış Müdürü", Permissions = "customers.read,customers.write,quotes.read,quotes.write,products.read,stock.read,analytics.read" },
            new RoleDefinition { TenantId = tenantId, Code = "SalesRepresentative", Name = "Satış Temsilcisi", Permissions = "customers.read,customers.write,quotes.read,quotes.write,products.read,stock.read,easyquote.use" },
            new RoleDefinition { TenantId = tenantId, Code = "StockProcurement", Name = "Stok / Satın Alma Sorumlusu", Permissions = "products.read,products.write,stock.read,stock.write,quotes.read,analytics.read" },
            new RoleDefinition { TenantId = tenantId, Code = "OperationsManager", Name = "Yönetici / Operasyon", Permissions = "customers.read,quotes.read,products.read,stock.read,analytics.read" }
        };

        foreach (var role in roles)
        {
            if (!await db.RoleDefinitions.IgnoreQueryFilters().AnyAsync(item => item.TenantId == tenantId && item.Code == role.Code))
            {
                db.RoleDefinitions.Add(role);
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task AddUserAsync(AppDbContext db, IPasswordHasher<AppUser> hasher, Guid tenantId, string email, string displayName, string role, string password, string permissions)
    {
        if (await db.Users.IgnoreQueryFilters().AnyAsync(item => item.TenantId == tenantId && item.Email == email)) return;

        var user = new AppUser
        {
            TenantId = tenantId,
            Email = email,
            DisplayName = displayName,
            Role = role,
            Permissions = permissions
        };
        user.PasswordHash = hasher.HashPassword(user, password);
        db.Users.Add(user);
        await db.SaveChangesAsync();
    }
}
