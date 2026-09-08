using FlooringErp.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FlooringErp.Api.Infrastructure;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
    : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<RoleDefinition> RoleDefinitions => Set<RoleDefinition>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProductSystem> ProductSystems => Set<ProductSystem>();
    public DbSet<Quote> Quotes => Set<Quote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Tenant>().HasIndex(item => item.Slug).IsUnique();
        modelBuilder.Entity<AppUser>().HasIndex(item => new { item.TenantId, item.Email }).IsUnique();
        modelBuilder.Entity<Quote>().HasIndex(item => new { item.TenantId, item.QuoteNumber }).IsUnique();

        modelBuilder.Entity<AppUser>().HasQueryFilter(item => item.TenantId == tenantContext.TenantId);
        modelBuilder.Entity<RoleDefinition>().HasQueryFilter(item => item.TenantId == tenantContext.TenantId);
        modelBuilder.Entity<Customer>().HasQueryFilter(item => item.TenantId == tenantContext.TenantId);
        modelBuilder.Entity<Project>().HasQueryFilter(item => item.TenantId == tenantContext.TenantId);
        modelBuilder.Entity<ProductSystem>().HasQueryFilter(item => item.TenantId == tenantContext.TenantId);
        modelBuilder.Entity<Quote>().HasQueryFilter(item => item.TenantId == tenantContext.TenantId);
    }

    public override int SaveChanges()
    {
        StampTenantEntities();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampTenantEntities();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void StampTenantEntities()
    {
        if (!tenantContext.HasTenant)
        {
            throw new InvalidOperationException("Tenant context is required for tenant-owned data.");
        }

        foreach (var entry in ChangeTracker.Entries<TenantEntity>().Where(item => item.State == EntityState.Added))
        {
            entry.Entity.TenantId = tenantContext.TenantId;
        }
    }
}
