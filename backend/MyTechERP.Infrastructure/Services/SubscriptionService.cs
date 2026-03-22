using Microsoft.EntityFrameworkCore;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.domain.Enums;
using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services
{
    /// <summary>
    /// Manages tenant subscription state in the database.
    /// Called by the Stripe webhook controller after verifying signature.
    /// </summary>
    public class SubscriptionService : ISubscriptionService
    {
        private readonly ApplicationDbContext _db;

        public SubscriptionService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<TenantSubscription?> GetByTenantIdAsync(int tenantId)
        {
            return await _db.TenantSubscriptions
                .AsNoTracking()
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.TenantId == tenantId);
        }

        public async Task<TenantSubscription?> GetByStripeSubscriptionIdAsync(string stripeSubscriptionId)
        {
            return await _db.TenantSubscriptions
                .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscriptionId);
        }

        public async Task ActivateSubscriptionAsync(
            int tenantId,
            string stripeCustomerId,
            string stripeSubscriptionId,
            int planId,
            DateTime periodEnd)
        {
            // Upsert: if a record already exists for this tenant, update it; otherwise create.
            var existing = await _db.TenantSubscriptions
                .FirstOrDefaultAsync(s => s.TenantId == tenantId);

            if (existing == null)
            {
                _db.TenantSubscriptions.Add(new TenantSubscription
                {
                    TenantId             = tenantId,
                    StripeCustomerId     = stripeCustomerId,
                    StripeSubscriptionId = stripeSubscriptionId,
                    SubscriptionPlanId   = planId,
                    SubscriptionStatus   = SubscriptionStatus.Active,
                    CurrentPeriodEnd     = periodEnd,
                    CreatedAt            = DateTime.UtcNow,
                    UpdatedAt            = DateTime.UtcNow,
                });
            }
            else
            {
                existing.StripeCustomerId     = stripeCustomerId;
                existing.StripeSubscriptionId = stripeSubscriptionId;
                existing.SubscriptionPlanId   = planId;
                existing.SubscriptionStatus   = SubscriptionStatus.Active;
                existing.CurrentPeriodEnd     = periodEnd;
                existing.UpdatedAt            = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }

        public async Task MarkPastDueAsync(string stripeSubscriptionId)
        {
            var subscription = await GetByStripeSubscriptionIdAsync(stripeSubscriptionId);
            if (subscription == null) return;

            subscription.SubscriptionStatus = SubscriptionStatus.PastDue;
            subscription.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task CancelSubscriptionAsync(string stripeSubscriptionId)
        {
            var subscription = await GetByStripeSubscriptionIdAsync(stripeSubscriptionId);
            if (subscription == null) return;

            subscription.SubscriptionStatus = SubscriptionStatus.Canceled;
            subscription.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task<IEnumerable<SubscriptionPlan>> GetPlansAsync()
        {
            return await _db.SubscriptionPlans
                .AsNoTracking()
                .Where(p => p.IsActive)
                .OrderBy(p => p.MonthlyPrice)
                .ToListAsync();
        }

        public async Task<SubscriptionPlan?> GetPlanByStripePriceIdAsync(string stripePriceId)
        {
            return await _db.SubscriptionPlans
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.StripePriceId == stripePriceId);
        }

        /// <summary>
        /// Returns the PlanFeature flags for the tenant.
        /// - If active paid subscription: Returns Plan's features.
        /// - If active trial (no paid plan, within 14 days): Returns ALL features (Pro equivalent) for evaluation.
        /// - Otherwise: Returns None.
        /// </summary>
        public async Task<PlanFeature> GetPlanFeaturesAsync(int tenantId)
        {
            var subscription = await _db.TenantSubscriptions
                .AsNoTracking()
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.TenantId == tenantId);

            if (subscription != null && subscription.SubscriptionStatus == SubscriptionStatus.Active && subscription.Plan != null)
            {
                return subscription.Plan.PlanFeatures;
            }

            // No active paid subscription. Check if they are on an active trial.
            bool isTrialActive = await IsTrialActiveAsync(tenantId);
            if (isTrialActive)
            {
                // Trial users get ALL features to evaluate the system
                return PlanFeature.HrPayroll | 
                       PlanFeature.ChecklistFormBuilder | 
                       PlanFeature.AuditLogs | 
                       PlanFeature.AdvancedAnalytics |
                       PlanFeature.OfflineSync;
            }

            return PlanFeature.None;
        }

        /// <summary>
        /// Returns true when the tenant has no paid subscription AND is within their 14-day trial window.
        /// </summary>
        public async Task<bool> IsTrialActiveAsync(int tenantId)
        {
            // If they have an active paid subscription, they are not on trial anymore.
            var subscription = await _db.TenantSubscriptions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.TenantId == tenantId
                    && s.SubscriptionStatus == SubscriptionStatus.Active);

            if (subscription != null) return false;

            var tenant = await _db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == tenantId);

            if (tenant == null) return false;

            // SubscriptionExpiresAt is set to CreatedAt + 14 days during registration.
            return DateTime.UtcNow <= tenant.SubscriptionExpiresAt;
        }
    }
}
