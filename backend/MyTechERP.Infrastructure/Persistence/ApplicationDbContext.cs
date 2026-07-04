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
using MytechERP.domain.Entities.sales;
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
        public DbSet<MytechERP.domain.Entities.System.SystemRegion> SystemRegions { get; set; }
        public DbSet<Product> Products { get; set; }

        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Site> Sites { get; set; }
        public DbSet<Office> Offices { get; set; }
        public DbSet<SiteDocument> SiteDocuments { get; set; }
        public DbSet<ToolBoxTalk> ToolBoxTalks { get; set; }
        public DbSet<ToolBoxTalkAttendee> ToolBoxTalkAttendees { get; set; }
        public DbSet<TrainingDetail> TrainingDetails { get; set; }
        public DbSet<TrainingDetailParticipant> TrainingDetailParticipants { get; set; }
        public DbSet<Building> Buildings { get; set; }
        public DbSet<Floor> Floors { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<Asset> Assets { get; set; }
        public DbSet<WorkOrder> WorkOrders { get; set; }
        public DbSet<JobEvidence> JobEvidences { get; set; }
        public DbSet<InspectionQuestion> InspectionQuestions { get; set; }
        
        public DbSet<StoreTool> StoreTools { get; set; }
        public DbSet<StoreDailyLog> StoreDailyLogs { get; set; }
        public DbSet<StoreDailyLogItem> StoreDailyLogItems { get; set; }
        public DbSet<SiteToolStock> SiteToolStocks { get; set; }
        public DbSet<ContractItem> ContractItems { get; set; }
        public DbSet<ChecklistQuestion> ChecklistQuestions { get; set; }
        public DbSet<WorkOrderChecklistResult> WorkOrderChecklistResults { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<QuotationItem> QuotationsItem { get; set; }
        public DbSet<QuotationSettings> QuotationSettings { get; set; }
        public DbSet<TermsAndConditionsTemplate> TermsAndConditionsTemplates { get; set; }
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
        public DbSet<BankAccount> BankAccounts { get; set; }
        public DbSet<TimeLog> TimeLogs { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<EmployeePayrollProfile> EmployeeProfiles { get; set; }
        public DbSet<PayrollEntry> PayrollEntries { get; set; }
        public DbSet<Payslip> Payslips { get; set; }
        public DbSet<SyncLog> SyncLogs { get; set; }
        public DbSet<SyncConflict> SyncConflicts { get; set; }

        public DbSet<SalesLead> SalesLeads { get; set; }
        public DbSet<SiteVisit> SiteVisits { get; set; }
        public DbSet<VisitPhoto> VisitPhotos { get; set; }

        public DbSet<AmountRequestForm> AmountRequestForms { get; set; }
        public DbSet<AmountRequestPayment> AmountRequestPayments { get; set; }

        public DbSet<Expense> Expenses { get; set; }
        public DbSet<ExpenseItem> ExpenseItems { get; set; }
        
        public DbSet<MaterialReceivingForm> MaterialReceivingForms { get; set; }
        public DbSet<MaterialReceivingItem> MaterialReceivingItems { get; set; }
        
        
        public DbSet<DailyProgressReport> DailyProgressReports { get; set; }
        public DbSet<DprActivity> DprActivities { get; set; }
        public DbSet<DprEmployee> DprEmployees { get; set; }
        public DbSet<DprMaterial> DprMaterials { get; set; }
        public DbSet<DprAttachment> DprAttachments { get; set; }
        public DbSet<MomMeeting> MomMeetings { get; set; }
        public DbSet<MomAttendee> MomAttendees { get; set; }
        public DbSet<MomAttachment> MomAttachments { get; set; }

        public DbSet<MeetingMinutesExecution> MeetingMinutesExecutions { get; set; }
        public DbSet<MeetingMinutesExecutionAttendee> MeetingMinutesExecutionAttendees { get; set; }
        public DbSet<MeetingMinutesExecutionAttachment> MeetingMinutesExecutionAttachments { get; set; }

        public DbSet<ItemProcurement> ItemProcurements { get; set; }
        public DbSet<ItemProcurementItem> ItemProcurementItems { get; set; }

        public DbSet<ProjectTechnicalHandover> ProjectTechnicalHandovers { get; set; }
        public DbSet<ProjectTechnicalHandoverAttachment> ProjectTechnicalHandoverAttachments { get; set; }

        public DbSet<ProjectSpotCheckSite> ProjectSpotCheckSites { get; set; }
        public DbSet<ProjectSpotCheckSiteItem> ProjectSpotCheckSiteItems { get; set; }

        public DbSet<IncidentRecord> IncidentRecords { get; set; }
        public DbSet<IncidentRecordItem> IncidentRecordItems { get; set; }

        public DbSet<ApplicationForm> ApplicationForms { get; set; }
        public DbSet<ApplicationFormAttachment> ApplicationFormAttachments { get; set; }

        public DbSet<VehicleTravelForm> VehicleTravelForms { get; set; }
        public DbSet<VehicleTravelFormAttachment> VehicleTravelFormAttachments { get; set; }

        public DbSet<MytechERP.domain.Entities.HR.EmployeeInfo> EmployeeInfos { get; set; }
        
        public DbSet<MytechERP.domain.Entities.Procurement.ProcurementRequest> ProcurementRequests { get; set; }
        public DbSet<MytechERP.domain.Entities.Procurement.ProcurementRequestItem> ProcurementRequestItems { get; set; }
        public DbSet<MytechERP.domain.Entities.Procurement.ProcurementQuote> ProcurementQuotes { get; set; }
        public DbSet<MytechERP.domain.Entities.Procurement.ProcurementQuoteItem> ProcurementQuoteItems { get; set; }


        // ─── SaaS Subscription ─────────────────────────────────────────
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<TenantSubscription> TenantSubscriptions { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {

            base.OnModelCreating(builder);

            builder.Entity<MytechERP.domain.Entities.Procurement.ProcurementRequestItem>()
                .Property(p => p.Quantity)
                .HasPrecision(18, 4);
                
            builder.Entity<MytechERP.domain.Entities.Procurement.ProcurementQuote>()
                .Property(p => p.TotalAmount)
                .HasPrecision(18, 2);

            builder.Entity<MytechERP.domain.Entities.Procurement.ProcurementQuoteItem>()
                .Property(p => p.UnitRate)
                .HasPrecision(18, 2);
                
            builder.Entity<MytechERP.domain.Entities.Procurement.ProcurementQuoteItem>()
                .Property(p => p.LineTotal)
                .HasPrecision(18, 2);
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
            
            builder.Entity<SalesLead>()
                .HasOne(sl => sl.Site)
                .WithMany()
                .HasForeignKey(sl => sl.SiteId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<SalesLead>()
                .HasOne(sl => sl.Customer)
                .WithMany()
                .HasForeignKey(sl => sl.CustomerId)
                .OnDelete(DeleteBehavior.Restrict); 
            builder.Entity<Customer>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<Site>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<ToolBoxTalk>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<ToolBoxTalkAttendee>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<TrainingDetail>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<TrainingDetailParticipant>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<Building>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<Floor>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<Room>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<Contract>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId && !x.IsDeleted);
            builder.Entity<ContractItem>().HasQueryFilter(ci => ci.TenantId == _currentUserService.TenantId && !ci.IsDeleted);
            builder.Entity<Asset>().HasQueryFilter(a => a.TenantId == _currentUserService.TenantId && !a.IsDeleted);
            builder.Entity<WorkOrder>().HasQueryFilter(w => w.TenantId == _currentUserService.TenantId && !w.IsDeleted);
            builder.Entity<Quotation>().HasQueryFilter(q => q.TenantId == _currentUserService.TenantId && !q.IsDeleted);
            builder.Entity<QuotationItem>().HasQueryFilter(qi => qi.TenantId == _currentUserService.TenantId && !qi.IsDeleted);
            builder.Entity<QuotationSettings>().HasQueryFilter(qs => qs.TenantId == _currentUserService.TenantId && !qs.IsDeleted);
            builder.Entity<TermsAndConditionsTemplate>().HasQueryFilter(t => t.TenantId == _currentUserService.TenantId && !t.IsDeleted);
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
            builder.Entity<BankAccount>().HasQueryFilter(ba => ba.TenantId == _currentUserService.TenantId && !ba.IsDeleted);
            builder.Entity<Product>().HasQueryFilter(p => p.TenantId == _currentUserService.TenantId && !p.IsDeleted);
            builder.Entity<Category>().HasQueryFilter(c => c.TenantId == _currentUserService.TenantId && !c.IsDeleted);
            builder.Entity<TimeLog>().HasQueryFilter(tl => tl.TenantId == _currentUserService.TenantId);
            builder.Entity<SyncLog>().HasQueryFilter(sl => sl.TenantId == _currentUserService.TenantId);
            builder.Entity<SyncConflict>().HasQueryFilter(sc => sc.TenantId == _currentUserService.TenantId);
            builder.Entity<AuditLog>().HasQueryFilter(al => al.TenantId == _currentUserService.TenantId);
            builder.Entity<EmployeePayrollProfile>().HasQueryFilter(epp => epp.TenantId == _currentUserService.TenantId);
            builder.Entity<SalesLead>().HasQueryFilter(sl => sl.TenantId == _currentUserService.TenantId && !sl.IsDeleted);
            builder.Entity<SiteVisit>().HasQueryFilter(sv => sv.TenantId == _currentUserService.TenantId && !sv.IsDeleted);
            builder.Entity<VisitPhoto>().HasQueryFilter(vp => vp.TenantId == _currentUserService.TenantId && !vp.IsDeleted);
            builder.Entity<AmountRequestForm>().HasQueryFilter(arf => arf.TenantId == _currentUserService.TenantId && !arf.IsDeleted);
            builder.Entity<Expense>().HasQueryFilter(e => e.TenantId == _currentUserService.TenantId && !e.IsDeleted);
            builder.Entity<ExpenseItem>().HasQueryFilter(ei => ei.TenantId == _currentUserService.TenantId);
            builder.Entity<MaterialReceivingForm>().HasQueryFilter(mrf => mrf.TenantId == _currentUserService.TenantId && !mrf.IsDeleted);
            builder.Entity<ApplicationForm>().HasQueryFilter(af => af.TenantId == _currentUserService.TenantId && !af.IsDeleted);
            builder.Entity<StoreTool>().HasQueryFilter(st => st.TenantId == _currentUserService.TenantId && !st.IsDeleted);
            builder.Entity<StoreDailyLog>().HasQueryFilter(sdl => sdl.TenantId == _currentUserService.TenantId && !sdl.IsDeleted);
            builder.Entity<StoreDailyLogItem>().HasQueryFilter(sdli => sdli.TenantId == _currentUserService.TenantId && !sdli.IsDeleted);

            // SiteToolStock: per-site inventory
            builder.Entity<SiteToolStock>()
                .HasOne(s => s.Site)
                .WithMany()
                .HasForeignKey(s => s.SiteId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.Entity<SiteToolStock>()
                .HasOne(s => s.StoreTool)
                .WithMany()
                .HasForeignKey(s => s.StoreToolId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.Entity<SiteToolStock>()
                .HasIndex(s => new { s.SiteId, s.StoreToolId })
                .IsUnique();
            builder.Entity<VehicleTravelForm>().HasQueryFilter(vtf => vtf.TenantId == _currentUserService.TenantId && !vtf.IsDeleted);


            builder.Entity<ApplicationFormAttachment>()
                .HasOne(a => a.ApplicationForm)
                .WithMany(f => f.Attachments)
                .HasForeignKey(a => a.ApplicationFormId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<VehicleTravelFormAttachment>()
                .HasOne(a => a.VehicleTravelForm)
                .WithMany(f => f.Attachments)
                .HasForeignKey(a => a.VehicleTravelFormId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<MaterialReceivingForm>()
                .HasOne(m => m.CreatedByUser)
                .WithMany()
                .HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            
            builder.Entity<DailyProgressReport>().HasQueryFilter(mrf => mrf.TenantId == _currentUserService.TenantId && !mrf.IsDeleted);
            
            builder.Entity<DailyProgressReport>()
                .HasOne(m => m.CreatedByUser)
                .WithMany()
                .HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<DprActivity>().HasQueryFilter(mrf => mrf.TenantId == _currentUserService.TenantId && !mrf.IsDeleted);
            builder.Entity<DprEmployee>().HasQueryFilter(mrf => mrf.TenantId == _currentUserService.TenantId && !mrf.IsDeleted);
            builder.Entity<DprMaterial>().HasQueryFilter(mrf => mrf.TenantId == _currentUserService.TenantId && !mrf.IsDeleted);
            builder.Entity<DprAttachment>().HasQueryFilter(mrf => mrf.TenantId == _currentUserService.TenantId && !mrf.IsDeleted);

            builder.Entity<MomMeeting>().HasQueryFilter(m => m.TenantId == _currentUserService.TenantId && !m.IsDeleted);
            
            builder.Entity<MomMeeting>()
                .HasOne(m => m.CreatedByUser)
                .WithMany()
                .HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MeetingMinutesExecution>().HasQueryFilter(m => m.TenantId == _currentUserService.TenantId && !m.IsDeleted);
            
            builder.Entity<MeetingMinutesExecution>()
                .HasOne(m => m.CreatedByUser)
                .WithMany()
                .HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ItemProcurement>().HasQueryFilter(ip => ip.TenantId == _currentUserService.TenantId && !ip.IsDeleted);
            builder.Entity<ItemProcurementItem>().HasQueryFilter(ipi => ipi.TenantId == _currentUserService.TenantId && !ipi.IsDeleted);

            builder.Entity<ItemProcurement>()
                .HasOne(ip => ip.CreatedByUser)
                .WithMany()
                .HasForeignKey(ip => ip.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            
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
            builder.Entity<TrainingDetailParticipant>()
                .HasOne(p => p.TrainingDetail)
                .WithMany(t => t.Participants)
                .HasForeignKey(p => p.TrainingDetailId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ProjectSpotCheckSite>()
                .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _currentUserService.TenantId);

            builder.Entity<ProjectSpotCheckSiteItem>()
                .HasOne(i => i.ProjectSpotCheckSite)
                .WithMany(p => p.Items)
                .HasForeignKey(i => i.ProjectSpotCheckSiteId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ProjectSpotCheckSiteItem>()
                .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _currentUserService.TenantId);

            builder.Entity<IncidentRecord>()
                .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _currentUserService.TenantId);

            builder.Entity<IncidentRecordItem>()
                .HasOne(i => i.IncidentRecord)
                .WithMany(p => p.Items)
                .HasForeignKey(i => i.IncidentRecordId)
                .OnDelete(DeleteBehavior.Cascade);

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

            var auditEntries = new List<AuditEntry>();
            var userId = _currentUserService.UserId ?? "System";
            var tenantId = _currentUserService.TenantId ?? 0;

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                // Only audit syncable entities or entities we care about, but to be exhaustive we audit all non-audit entities.
                var auditEntry = new AuditEntry(entry)
                {
                    EntityName = entry.Entity.GetType().Name,
                    UserId = userId,
                    Action = entry.State.ToString(),
                    TenantId = tenantId
                };
                
                auditEntries.Add(auditEntry);

                foreach (var property in entry.Properties)
                {
                    if (property.IsTemporary)
                    {
                        auditEntry.TemporaryProperties.Add(property);
                        continue;
                    }

                    string propertyName = property.Metadata.Name;

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                            break;
                        case EntityState.Deleted:
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            break;
                        case EntityState.Modified:
                            if (property.IsModified)
                            {
                                auditEntry.OldValues[propertyName] = property.OriginalValue;
                                auditEntry.NewValues[propertyName] = property.CurrentValue;
                            }
                            break;
                    }
                }
            }

            var result = await base.SaveChangesAsync(cancellationToken);

            if (auditEntries.Any())
            {
                foreach (var auditEntry in auditEntries)
                {
                    foreach (var prop in auditEntry.TemporaryProperties)
                    {
                        if (prop.Metadata.IsPrimaryKey())
                        {
                            auditEntry.NewValues[prop.Metadata.Name] = prop.CurrentValue;
                        }
                        else
                        {
                            auditEntry.NewValues[prop.Metadata.Name] = prop.CurrentValue;
                        }
                    }

                    AuditLogs.Add(auditEntry.ToAuditLog());
                }
                
                await base.SaveChangesAsync(cancellationToken);
            }

            return result;
        }



    }

    public class AuditEntry
    {
        public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry Entry { get; }
        public string EntityName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public int TenantId { get; set; }
        public Dictionary<string, object?> OldValues { get; } = new Dictionary<string, object?>();
        public Dictionary<string, object?> NewValues { get; } = new Dictionary<string, object?>();
        public List<Microsoft.EntityFrameworkCore.ChangeTracking.PropertyEntry> TemporaryProperties { get; } = new List<Microsoft.EntityFrameworkCore.ChangeTracking.PropertyEntry>();

        public bool HasTemporaryProperties => TemporaryProperties.Any();

        public AuditEntry(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
        {
            Entry = entry;
        }

        public AuditLog ToAuditLog()
        {
            var audit = new AuditLog
            {
                EntityName = EntityName,
                Action = Action,
                UserId = UserId,
                TenantId = TenantId,
                Timestamp = DateTime.UtcNow,
                EntityId = 0
            };
            
            var idProp = Entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());
            if (idProp != null && idProp.CurrentValue is int intId) 
            {
                audit.EntityId = intId;
            }

            audit.OldValue = OldValues.Count == 0 ? null : System.Text.Json.JsonSerializer.Serialize(OldValues);
            audit.NewValue = NewValues.Count == 0 ? null : System.Text.Json.JsonSerializer.Serialize(NewValues);
            
            return audit;
        }
    }
}
