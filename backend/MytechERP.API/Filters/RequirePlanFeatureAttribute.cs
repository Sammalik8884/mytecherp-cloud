using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Enums;

namespace MytechERP.API.Filters
{
    /// <summary>
    /// Declares the required PlanFeature flag needed to access decorated controllers/actions.
    /// Usage: [RequirePlanFeature(PlanFeature.HrPayroll)]
    ///
    /// Works like TypeFilterAttribute so the inner filter can take DI services plus the feature argument.
    /// Returns 402 Payment Required when the tenant has no paid subscription or trial has expired.
    /// Returns 403 Forbidden when the tenant has a paid subscription but it does not include the feature.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public class RequirePlanFeatureAttribute : TypeFilterAttribute
    {
        public RequirePlanFeatureAttribute(PlanFeature requiredFeature)
            : base(typeof(PlanFeatureFilter))
        {
            Arguments = new object[] { requiredFeature };
        }
    }

    /// <summary>
    /// Inner filter instantiated by RequirePlanFeatureAttribute. Resolved via DI.
    /// </summary>
    public class PlanFeatureFilter : IAsyncActionFilter
    {
        private readonly ISubscriptionService _subscriptionService;
        private readonly ICurrentUserService  _currentUserService;
        private readonly PlanFeature          _requiredFeature;

        public PlanFeatureFilter(
            ISubscriptionService subscriptionService,
            ICurrentUserService currentUserService,
            PlanFeature requiredFeature)
        {
            _subscriptionService = subscriptionService;
            _currentUserService  = currentUserService;
            _requiredFeature     = requiredFeature;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var tenantId = _currentUserService.TenantId;
            if (tenantId == null)
            {
                // Let the auth middleware handle unauthenticated requests.
                await next();
                return;
            }

            // Step 1: Check if the tenant has any valid access at all (trial or paid).
            var subscription = await _subscriptionService.GetByTenantIdAsync(tenantId.Value);
            bool hasPaidActive = subscription != null
                && subscription.SubscriptionStatus == domain.Enums.SubscriptionStatus.Active;
            bool trialActive = !hasPaidActive
                && await _subscriptionService.IsTrialActiveAsync(tenantId.Value);

            if (!hasPaidActive && !trialActive)
            {
                // Trial has expired and no paid plan — 402
                context.Result = new ObjectResult(new
                {
                    error = "Your trial has expired. Please subscribe to continue."
                })
                { StatusCode = StatusCodes.Status402PaymentRequired };
                return;
            }

            // Step 2: Check plan features. Trial users and Basic subscribers get PlanFeature.None.
            var grantedFeatures = await _subscriptionService.GetPlanFeaturesAsync(tenantId.Value);

            if (!grantedFeatures.HasFlag(_requiredFeature))
            {
                context.Result = new ObjectResult(new
                {
                    error = $"This feature is not included in your current plan. Please upgrade to Pro."
                })
                { StatusCode = StatusCodes.Status403Forbidden };
                return;
            }

            await next();
        }
    }
}
