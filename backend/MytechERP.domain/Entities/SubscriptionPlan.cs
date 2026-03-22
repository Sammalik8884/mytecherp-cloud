using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MytechERP.domain.Enums;

namespace MytechERP.domain.Entities
{
    /// <summary>
    /// Represents a SaaS subscription plan available to tenants.
    /// Each plan maps to a pre-configured Price in Stripe.
    /// </summary>
    public class SubscriptionPlan
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>Human-readable name shown in the UI (e.g. "Basic", "Pro").</summary>
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        /// <summary>Stripe Price ID (price_xxx). Must match the recurring price in the Stripe dashboard.</summary>
        [Required, MaxLength(200)]
        public string StripePriceId { get; set; } = string.Empty;

        /// <summary>Monthly cost in USD for display purposes only.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyPrice { get; set; }

        /// <summary>Maximum number of users allowed for this plan. Enforced on user creation.</summary>
        public int MaxUsers { get; set; }

        /// <summary>
        /// Bitmask of Pro-only features this plan unlocks.
        /// Basic = PlanFeature.None. Pro = HrPayroll | ChecklistFormBuilder | AuditLogs | AdvancedAnalytics.
        /// </summary>
        public PlanFeature PlanFeatures { get; set; } = PlanFeature.None;

        public bool IsActive { get; set; } = true;

        // Navigation
        public ICollection<TenantSubscription> Subscriptions { get; set; } = new List<TenantSubscription>();
    }
}
