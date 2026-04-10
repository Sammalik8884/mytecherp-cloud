using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.API.Filters;
using MytechERP.Application.Interfaces;

namespace MytechERP.API.Controllers
{
    /// <summary>
    /// Exposes subscription management actions for authenticated tenants.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly ISubscriptionService   _subscriptionService;
        private readonly IPaymentGatewayService _paymentGatewayService;
        private readonly ICurrentUserService    _currentUserService;

        public SubscriptionController(
            ISubscriptionService subscriptionService,
            IPaymentGatewayService paymentGatewayService,
            ICurrentUserService currentUserService)
        {
            _subscriptionService   = subscriptionService;
            _paymentGatewayService = paymentGatewayService;
            _currentUserService    = currentUserService;
        }

        /// <summary>
        /// Returns all available subscription plans for display in the pricing/upgrade UI.
        /// GET /api/subscription/plans
        /// </summary>
        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _subscriptionService.GetPlansAsync();
            return Ok(plans.Select(p => new
            {
                p.Id,
                p.Name,
                p.MonthlyPrice,
                p.MaxUsers,
                p.StripePriceId
            }));
        }

        /// <summary>
        /// Returns the current subscription status for the authenticated tenant.
        /// GET /api/subscription/status
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var tenantId = _currentUserService.TenantId;
            if (tenantId == null) return Unauthorized();

            var subscription = await _subscriptionService.GetByTenantIdAsync(tenantId.Value);
            if (subscription == null)
            {
                return Ok(new { hasSubscription = false });
            }

            return Ok(new
            {
                hasSubscription      = true,
                status               = subscription.SubscriptionStatus.ToString(),
                planName             = subscription.Plan?.Name,          // flat field
                planId               = subscription.Plan?.Id,            // flat field for button comparison
                plan                 = subscription.Plan == null ? null : new
                {
                    id           = subscription.Plan.Id,
                    name         = subscription.Plan.Name,
                    monthlyPrice = subscription.Plan.MonthlyPrice,
                    maxUsers     = subscription.Plan.MaxUsers,
                    stripePriceId= subscription.Plan.StripePriceId,
                    isActive     = subscription.Plan.IsActive
                },
                currentPeriodEnd     = subscription.CurrentPeriodEnd,
                stripeSubscriptionId = subscription.StripeSubscriptionId
            });
        }

        /// <summary>
        /// Returns the live PlanFeatures bitmask for the current tenant.
        /// Used by the frontend to refresh feature access after a plan upgrade without re-login.
        /// GET /api/subscription/refresh-features
        /// </summary>
        [HttpGet("refresh-features")]
        public async Task<IActionResult> RefreshFeatures()
        {
            var tenantId = _currentUserService.TenantId;
            if (tenantId == null) return Unauthorized();

            var subscription = await _subscriptionService.GetByTenantIdAsync(tenantId.Value);

            var features = MytechERP.domain.Enums.PlanFeature.None;
            if (subscription != null && subscription.SubscriptionStatus == MytechERP.domain.Enums.SubscriptionStatus.Active && subscription.Plan != null)
            {
                features = subscription.Plan.PlanFeatures;
            }
            else
            {
                var tenant = await _currentUserService.GetCurrentTenantAsync();
                if (tenant != null && DateTime.UtcNow <= tenant.SubscriptionExpiresAt)
                {
                    features = MytechERP.domain.Enums.PlanFeature.HrPayroll | 
                               MytechERP.domain.Enums.PlanFeature.ChecklistFormBuilder | 
                               MytechERP.domain.Enums.PlanFeature.AuditLogs | 
                               MytechERP.domain.Enums.PlanFeature.AdvancedAnalytics |
                               MytechERP.domain.Enums.PlanFeature.OfflineSync;
                }
            }

            return Ok(new
            {
                planFeatures = (int)features,
                planName     = subscription?.Plan?.Name ?? "Trial",
                status       = subscription?.SubscriptionStatus.ToString() ?? "Trial"
            });
        }

        /// <summary>
        /// Returns trial status for the current tenant.
        /// GET /api/subscription/trial-status
        /// </summary>
        [HttpGet("trial-status")]
        public async Task<IActionResult> GetTrialStatus()
        {
            var tenantId = _currentUserService.TenantId;
            if (tenantId == null) return Unauthorized();

            // Check if they have an active paid subscription
            var subscription = await _subscriptionService.GetByTenantIdAsync(tenantId.Value);
            bool hasActivePlan = subscription != null &&
                                 subscription.SubscriptionStatus == MytechERP.domain.Enums.SubscriptionStatus.Active;

            if (hasActivePlan)
            {
                return Ok(new
                {
                    isOnTrial    = false,
                    hasActivePlan = true,
                    isExpired    = false,
                    daysRemaining = 0,
                    trialEndsAt  = (DateTime?)null
                });
            }

            // Look up tenant trial data
            var tenant = await _currentUserService.GetCurrentTenantAsync();
            if (tenant == null) return Unauthorized();

            var trialStart = tenant.TrialStartedAt ?? tenant.CreatedAt;
            var trialEnd   = trialStart.AddDays(14);
            var now        = DateTime.UtcNow;
            var daysRemaining = Math.Max(0, (int)Math.Ceiling((trialEnd - now).TotalDays));
            var isExpired  = now > trialEnd;

            return Ok(new
            {
                isOnTrial     = !hasActivePlan,
                hasActivePlan = false,
                isExpired     = isExpired,
                daysRemaining = daysRemaining,
                trialEndsAt   = trialEnd
            });
        }

        /// <summary>
        /// Creates a Stripe Checkout Session (Mode=subscription) and returns the redirect URL.
        /// POST /api/subscription/create-checkout
        /// Body: { "stripePriceId": "price_xxx", "customerEmail": "user@example.com" }
        /// </summary>
        [HttpPost("create-checkout")]
        public async Task<IActionResult> CreateCheckout([FromBody] CreateSubscriptionCheckoutRequest request)
        {
            var tenantId = _currentUserService.TenantId;
            if (tenantId == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(request.StripePriceId))
                return BadRequest(new { error = "stripePriceId is required." });

            // Validate the plan exists
            var plan = await _subscriptionService.GetPlanByStripePriceIdAsync(request.StripePriceId);
            if (plan == null)
                return BadRequest(new { error = "Invalid plan selected." });

            var result = await _paymentGatewayService.CreateSubscriptionCheckoutAsync(
                tenantId.Value,
                request.CustomerEmail,
                request.StripePriceId);

            if (!result.IsSuccess)
                return BadRequest(new { error = result.ErrorMessage });

            return Ok(new
            {
                checkoutUrl          = result.CheckoutUrl,
                gatewayTransactionId = result.GatewayTransactionId
            });
        }

        // ─── Request DTOs ─────────────────────────────────────────────────────────────

        public class CreateSubscriptionCheckoutRequest
        {
            public string StripePriceId  { get; set; } = string.Empty;
            public string CustomerEmail  { get; set; } = string.Empty;
        }
    }
}
