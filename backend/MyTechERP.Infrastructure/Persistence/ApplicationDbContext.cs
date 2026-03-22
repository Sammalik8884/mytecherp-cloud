using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure.Internal;
using MytechERP.Application.Interfaces;
using MytechERP.domain;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.common;
using MytechERP.domain.Entities.Complaiance;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Entities.Finance;
using MytechERP.domain.Entities.HR;
using MytechERP.domain.Entities.Job;
using MytechERP.domain.Entities.System;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Inventory;
using MytechERP.domain.Quotations;
using MytechERP.domain.Enums;
using MyTechERP.Infrastructure.Persistence;
using MyTechERP.Infrastructure.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Infrastructure.Persistance
{
    public class ApplicationDbContext : IdentityDbContext<AppUser>
    {
        private readonly ICurrentUserService _currentUserService;
        private DummyCurrentUserService dummyUserService;

        public ApplicationDbContext(ICurrentUserService currentUserService, DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
            _currentUserService = currentUserService;
        }

        public ApplicationDbContext(DbContextOptions options, DummyCurrentUserService dummyUserService) : base(options)
        {
            this.dummyUserService = dummyUserService;
        }

        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Product> Products { get; set; }

        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Site> Sites { get; set; }
        public DbSet<Building> Buildings { get; set; }
        public DbSet<Floor> Floors { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<Asset> Assets { get; set; }
        public DbSet<WorkOrder> WorkOrders { get; set; }
        public DbSet<JobEvidence> JobEvidences { get; set; }
        public DbSet<InspectionQuestion> InspectionQuestions { get; set; }
        public DbSet<ContractItem> ContractItems { get; set; }
        public DbSet<ChecklistQuestion> ChecklistQuestions { get; set; }
        public DbSet<WorkOrderChecklistResult> WorkOrderChecklistResults { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<QuotationItem> QuotationsItem { get; set; }
        public DbSet<DocumentSignature> DocumentSignatures { get; set; }
        public DbSet<SystemFailure> SystemFailures { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<InventoryStock> InventoryStocks { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
         public DbSet<InvoiceItem> invoiceItems { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<StockTransfer> stockTransfers { get; set; }
        public DbSet<StockTransferItem> stockTransferItems { get; set; }
        public DbSet<StockAdjustment> StockAdjustments { get; set; }
        public DbSet<PaymentTransaction> PaymentTransactions { get; set; }
        public DbSet<TimeLog> TimeLogs { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<EmployeePayrollProfile> EmployeeProfiles { get; set; }
        public DbSet<PayrollEntry> PayrollEntries { get; set; }
        public DbSet<Payslip> Payslips { get; set; }
        public DbSet<SyncLog> SyncLogs { get; set; }
        public DbSet<SyncConflict> SyncConflicts { get; set; }

        // ─── SaaS Subscription ─────────────────────────────────────────
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<TenantSubscription> TenantSubscriptions { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {

            base.OnModelCreating(builder);
            builder.Entity<Tenant>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id)
                      .UseIdentityColumn()
                      .ValueGeneratedOnAdd();
            });
            builder.Entity<Product>()
         .Property(p => p.Price)
         .HasColumnType("decimal(18,2)");
            builder.Entity<MytechERP.domain.Entities.CRM.ContractItem>()
        .HasOne(ci => ci.Asset)
        .WithMany()
        .HasForeignKey(ci => ci.AssetId)
        .OnDelete(DeleteBehavior.Restrict);
            builder.Entity<MytechERP.domain.Entities.WorkOrder>()
       .HasOne(w => w.Asset)
       .WithMany()
       .HasForeignKey(w => w.AssetId)
       .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MytechERP.domain.Entities.WorkOrder>()
       .HasOne(w => w.Technician)
       .WithMany()
       .HasForeignKey(w => w.TechnicianId)
       .OnDelete(DeleteBehavior.Restrict);
       
            builder.Entity<MytechERP.domain.Entities.WorkOrder>()
       .HasIndex(w => new { w.TenantId, w.TechnicianId });
            builder.Entity<MytechERP.domain.Entities.CRM.ContractItem>()
        .Property(c => c.UnitPrice)
        .HasColumnType("decimal(18,2)");
            builder.Entity<MytechERP.domain.Entities.CRM.Contract>()
        .Property(c => c.ContractValue)
        .HasColumnType("decimal(18,2)");
            builder.Entity<QuotationItem>()
    .Property(q => q.UnitPrice)
    .HasColumnType("decimal(18,2)");
            builder.Entity<StockTransfer>()
        .HasOne(t => t.FromWarehouse)
        .WithMany()
        .HasForeignKey(t => t.FromWarehouseId)
        .OnDelete(DeleteBehavior.Restrict);
            builder.Entity<Product>()
    .HasOne(p => p.Category)
    .WithMany(c => c.Products)
    .HasForeignKey(p => p.CategoryId)
    .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<StockTransfer>()
                .HasOne(t => t.ToWarehouse)
                .WithMany()
                .HasForeignKey(t => t.ToWarehouseId)
                .OnDelete(DeleteBehavior.Restrict); 
            builder.Entity<Customer>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<Site>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<Building>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<Floor>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<Room>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<Contract>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<ContractItem>().HasQueryFilter(ci => ci.TenantId == _currentUserService.TenantId && !ci.IsDeleted);
            builder.Entity<Asset>().HasQueryFilter(a => a.TenantId == _currentUserService.TenantId && !a.IsDeleted);
            builder.Entity<WorkOrder>().HasQueryFilter(w => w.TenantId == _currentUserService.TenantId && !w.IsDeleted);
            builder.Entity<Quotation>().HasQueryFilter(q => q.TenantId == _currentUserService.TenantId && !q.IsDeleted);
            builder.Entity<QuotationItem>().HasQueryFilter(qi => qi.TenantId == _currentUserService.TenantId && !qi.IsDeleted);
            builder.Entity<Invoice>().HasQueryFilter(i => i.TenantId == _currentUserService.TenantId && !i.IsDeleted);
            builder.Entity<Payslip>().HasQueryFilter(p => p.TenantId == _currentUserService.TenantId && !p.IsDeleted);
            builder.Entity<PayrollEntry>().HasQueryFilter(p => p.TenantId == _currentUserService.TenantId && !p.IsDeleted);
            builder.Entity<Warehouse>().HasQueryFilter(w => w.TenantId == _currentUserService.TenantId && !w.IsDeleted);
            builder.Entity<InventoryStock>().HasQueryFilter(s => s.TenantId == _currentUserService.TenantId && !s.IsDeleted);
            builder.Entity<PurchaseOrder>().HasQueryFilter(po => po.TenantId == _currentUserService.TenantId && !po.IsDeleted);
            builder.Entity<PurchaseOrderItem>().HasQueryFilter(poi => poi.TenantId == _currentUserService.TenantId && !poi.IsDeleted);
            builder.Entity<Vendor>().HasQueryFilter(v => v.TenantId == _currentUserService.TenantId && !v.IsDeleted);
            builder.Entity<StockTransfer>().HasQueryFilter(st => st.TenantId == _currentUserService.TenantId && !st.IsDeleted);
            builder.Entity<StockAdjustment>().HasQueryFilter(sa => sa.TenantId == _currentUserService.TenantId && !sa.IsDeleted);
            builder.Entity<PaymentTransaction>().HasQueryFilter(pt => pt.TenantId == _currentUserService.TenantId && !pt.IsDeleted);
            builder.Entity<Product>().HasQueryFilter(p => p.TenantId == _currentUserService.TenantId && !p.IsDeleted);
            builder.Entity<Category>().HasQueryFilter(c => c.TenantId == _currentUserService.TenantId && !c.IsDeleted);
            builder.Entity<TimeLog>().HasQueryFilter(tl => tl.TenantId == _currentUserService.TenantId);
            builder.Entity<SyncLog>().HasQueryFilter(sl => sl.TenantId == _currentUserService.TenantId);
            builder.Entity<SyncConflict>().HasQueryFilter(sc => sc.TenantId == _currentUserService.TenantId);
            builder.Entity<AuditLog>().HasQueryFilter(al => al.TenantId == _currentUserService.TenantId);
            builder.Entity<EmployeePayrollProfile>().HasQueryFilter(epp => epp.TenantId == _currentUserService.TenantId);

            // ─── Subscription Plan & Tenant Subscription ─────────────────────────────
            // No tenant query filter on SubscriptionPlan (it's global/shared data).
            builder.Entity<SubscriptionPlan>()
                .Property(p => p.MonthlyPrice)
                .HasColumnType("decimal(18,2)");

            builder.Entity<SubscriptionPlan>().HasData(
                new SubscriptionPlan { Id = 1, Name = "Basic", MonthlyPrice = 49.99m, MaxUsers = 5, StripePriceId = "price_1TCVwUGv46lRNfrQ3dYcAmXR", IsActive = true },
                new SubscriptionPlan { Id = 2, Name = "Pro", MonthlyPrice = 149.99m, MaxUsers = 25, StripePriceId = "price_1TCVwwGv46lRNfrQV7KVxwoZ", IsActive = true }
            );

            // TenantSubscription is NOT filtered by the current tenant so the webhook
            // controller (which runs as system/anonymous) can look up any tenant by
            // StripeSubscriptionId. Access control is enforced by the controller.
            builder.Entity<TenantSubscription>()
                .HasOne(ts => ts.Tenant)
                .WithMany()
                .HasForeignKey(ts => ts.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<TenantSubscription>()
                .HasOne(ts => ts.Plan)
                .WithMany(p => p.Subscriptions)
                .HasForeignKey(ts => ts.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<TenantSubscription>()
                .HasIndex(ts => ts.TenantId)
                .IsUnique(); // one active subscription per tenant

            builder.Entity<TenantSubscription>()
                .HasIndex(ts => ts.StripeSubscriptionId);

        }
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State == EntityState.Added)
                {
                    var tenantProperty = entry.Entity.GetType().GetProperty("TenantId");

                    if (tenantProperty != null && tenantProperty.PropertyType == typeof(int))
                    {
                        var loggedInTenantId = _currentUserService.TenantId ?? 0;

                        var existingTenantId = (int)tenantProperty.GetValue(entry.Entity);

                       
                        if (loggedInTenantId != 0 && existingTenantId == 0)
                        {
                            tenantProperty.SetValue(entry.Entity, loggedInTenantId);
                        }
                    }
                }
            }

            foreach (var entry in ChangeTracker.Entries<ISyncableEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        entry.Entity.IsDeleted = false;
                        break;
                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        break;
                    case EntityState.Deleted:
                        entry.State = EntityState.Modified;
                        entry.Entity.IsDeleted = true;
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }



    }
    }
