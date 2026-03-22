using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Enums;

namespace MytechERP.API.Filters
{
    /// <summary>
    /// Action filter that short-circuits requests with 402 Payment Required when:
    ///   - The tenant's subscription is PastDue or Canceled, OR
    ///   - The tenant has no active paid subscription AND their 14-day trial has expired.
    ///
    /// Usage: decorate any controller or action with [ServiceFilter(typeof(RequireActiveSubscriptionAttribute))].
    /// Must be registered in DI (ServiceFilter) because it takes constructor dependencies.
    ///
    ///   [ServiceFilter(typeof(RequireActiveSubscriptionAttribute))]
    ///   public class SomeController : ControllerBase { ... }
    ///
    /// Or register globally in Program.cs:
    ///   builder.Services.AddControllers(opts =>
    ///       opts.Filters.Add<RequireActiveSubscriptionAttribute>());
    /// </summary>
    public class RequireActiveSubscriptionAttribute : IAsyncActionFilter
    {
        private readonly ISubscriptionService _subscriptionService;
        private readonly ICurrentUserService  _currentUserService;

        public RequireActiveSubscriptionAttribute(
            ISubscriptionService subscriptionService,
            ICurrentUserService currentUserService)
        {
            _subscriptionService = subscriptionService;
            _currentUserService  = currentUserService;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Skip if user is not authenticated (other auth middleware will handle that).
            var tenantId = _currentUserService.TenantId;
            if (tenantId == null)
            {
                await next();
                return;
            }

            var subscription = await _subscriptionService.GetByTenantIdAsync(tenantId.Value);

            // Block if subscription is explicitly past-due or canceled.
            if (subscription != null
                && (subscription.SubscriptionStatus == SubscriptionStatus.PastDue
                    || subscription.SubscriptionStatus == SubscriptionStatus.Canceled))
            {
                context.Result = new ObjectResult(new
                {
                    error = "Subscription inactive. Please update your billing details."
                })
                { StatusCode = StatusCodes.Status402PaymentRequired };
                return;
            }

            // Allow if tenant has an active paid subscription.
            if (subscription != null && subscription.SubscriptionStatus == SubscriptionStatus.Active)
            {
                await next();
                return;
            }

            // No paid subscription — check if trial is still valid.
            bool trialActive = await _subscriptionService.IsTrialActiveAsync(tenantId.Value);
            if (!trialActive)
            {
                context.Result = new ObjectResult(new
                {
                    error = "Your free trial has expired. Please subscribe to continue using MytechERP."
                })
                { StatusCode = StatusCodes.Status402PaymentRequired };
                return;
            }

            await next();
        }
    }
}
