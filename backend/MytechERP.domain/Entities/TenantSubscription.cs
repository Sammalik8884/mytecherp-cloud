using MytechERP.domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities
{
    /// <summary>
    /// Tracks the active Stripe subscription for a specific tenant.
    /// One tenant has at most one active subscription record (upserted on webhook events).
    /// </summary>
    public class TenantSubscription
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>The tenant this subscription belongs to.</summary>
        public int TenantId { get; set; }

        /// <summary>Stripe Customer ID (cus_xxx). Persisted so we can look up the customer without querying Stripe.</summary>
        [MaxLength(200)]
        public string StripeCustomerId { get; set; } = string.Empty;

        /// <summary>Stripe Subscription ID (sub_xxx). Used as the primary lookup key from webhook events.</summary>
        [MaxLength(200)]
        public string StripeSubscriptionId { get; set; } = string.Empty;

        /// <summary>FK to the local plan record.</summary>
        public int SubscriptionPlanId { get; set; }

        /// <summary>Current lifecycle state, synced from Stripe webhook events.</summary>
        public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.Trialing;

        /// <summary>UTC timestamp of when the current billing period ends. Used to determine grace periods.</summary>
        public DateTime CurrentPeriodEnd { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(TenantId))]
        public Tenant? Tenant { get; set; }

        [ForeignKey(nameof(SubscriptionPlanId))]
        public SubscriptionPlan? Plan { get; set; }
    }
}
