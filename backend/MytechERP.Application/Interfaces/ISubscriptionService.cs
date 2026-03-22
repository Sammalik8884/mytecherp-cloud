using MytechERP.domain.Entities;
using MytechERP.domain.Enums;

namespace MytechERP.Application.Interfaces
{
    /// <summary>
    /// Manages tenant subscription lifecycle: reads status and updates from Stripe events.
    /// </summary>
    public interface ISubscriptionService
    {
        /// <summary>
        /// Returns the current subscription record for the given tenant, or null if none exists.
        /// </summary>
        Task<TenantSubscription?> GetByTenantIdAsync(int tenantId);

        /// <summary>
        /// Returns the subscription by its Stripe Subscription ID (used in webhook handlers).
        /// </summary>
        Task<TenantSubscription?> GetByStripeSubscriptionIdAsync(string stripeSubscriptionId);

        /// <summary>
        /// Called when checkout.session.completed fires. Creates or updates the subscription to Active.
        /// </summary>
        Task ActivateSubscriptionAsync(
            int tenantId,
            string stripeCustomerId,
            string stripeSubscriptionId,
            int planId,
            DateTime periodEnd);

        /// <summary>
        /// Called when invoice.payment_failed fires. Sets status to PastDue.
        /// </summary>
        Task MarkPastDueAsync(string stripeSubscriptionId);

        /// <summary>
        /// Called when customer.subscription.deleted fires. Sets status to Canceled.
        /// </summary>
        Task CancelSubscriptionAsync(string stripeSubscriptionId);

        /// <summary>
        /// Returns all available, active subscription plans.
        /// </summary>
        Task<IEnumerable<SubscriptionPlan>> GetPlansAsync();

        /// <summary>
        /// Finds a plan by its Stripe Price ID (used when activating from checkout metadata).
        /// </summary>
        Task<SubscriptionPlan?> GetPlanByStripePriceIdAsync(string stripePriceId);

        /// <summary>
        /// Returns the combined PlanFeature flags available to the tenant.
        /// Returns PlanFeature.None for trial users or tenants with no paid/active plan.
        /// </summary>
        Task<PlanFeature> GetPlanFeaturesAsync(int tenantId);

        /// <summary>
        /// Returns true if the tenant is within a valid 14-day trial window and has no paid subscription.
        /// </summary>
        Task<bool> IsTrialActiveAsync(int tenantId);
    }
}
