using FlooringErp.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FlooringErp.Api.Infrastructure;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
    : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<RoleDefinition> RoleDefinitions => Set<RoleDefinition>();
    public DbSet<PendingAccountChange> PendingAccountChanges => Set<PendingAccountChange>();
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

        modelBuilder.Entity<AppUser>().HasAlternateKey(item => new { item.TenantId, item.Id });
        modelBuilder.Entity<Customer>().HasAlternateKey(item => new { item.TenantId, item.Id });
        modelBuilder.Entity<PendingAccountChange>().HasIndex(item => new { item.TenantId, item.UserId, item.Status });

        modelBuilder.Entity<AppUser>()
            .HasOne(item => item.Tenant)
            .WithMany()
            .HasForeignKey(item => item.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<RoleDefinition>()
            .HasOne(item => item.Tenant)
            .WithMany()
            .HasForeignKey(item => item.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<PendingAccountChange>()
            .HasOne(item => item.User)
            .WithMany()
            .HasForeignKey(item => new { item.TenantId, item.UserId })
            .HasPrincipalKey(item => new { item.TenantId, item.Id })
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<PendingAccountChange>()
            .HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(item => item.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Customer>()
            .HasOne(item => item.Tenant)
            .WithMany()
            .HasForeignKey(item => item.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Project>()
            .HasOne(item => item.Tenant)
            .WithMany()
            .HasForeignKey(item => item.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ProductSystem>()
            .HasOne(item => item.Tenant)
            .WithMany()
            .HasForeignKey(item => item.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Quote>()
            .HasOne(item => item.Tenant)
            .WithMany()
            .HasForeignKey(item => item.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Project>()
            .HasOne(item => item.Customer)
            .WithMany(item => item.Projects)
            .HasForeignKey(item => new { item.TenantId, item.CustomerId })
            .HasPrincipalKey(item => new { item.TenantId, item.Id })
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Quote>()
            .HasOne(item => item.Customer)
            .WithMany(item => item.Quotes)
            .HasForeignKey(item => new { item.TenantId, item.CustomerId })
            .HasPrincipalKey(item => new { item.TenantId, item.Id })
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Quote>()
            .HasOne(item => item.AssignedToUser)
            .WithMany()
            .HasForeignKey(item => new { item.TenantId, item.AssignedToUserId })
            .HasPrincipalKey(item => new { item.TenantId, item.Id })
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AppUser>().HasQueryFilter(item => item.TenantId == tenantContext.TenantId);
        modelBuilder.Entity<RoleDefinition>().HasQueryFilter(item => item.TenantId == tenantContext.TenantId);
        modelBuilder.Entity<PendingAccountChange>().HasQueryFilter(item => item.TenantId == tenantContext.TenantId);
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
        var addedTenantEntities = ChangeTracker.Entries<TenantEntity>()
            .Where(item => item.State == EntityState.Added)
            .ToArray();

        if (addedTenantEntities.Length == 0)
        {
            return;
        }

        if (!tenantContext.HasTenant)
        {
            throw new InvalidOperationException("Tenant context is required for tenant-owned data.");
        }

        foreach (var entry in addedTenantEntities)
        {
            entry.Entity.TenantId = tenantContext.TenantId;
        }
    }
}
