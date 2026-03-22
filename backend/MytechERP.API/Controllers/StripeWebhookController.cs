using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.Interfaces;
using Stripe;
using Stripe.Checkout;
using MytechERP.domain.Entities;
namespace MytechERP.API.Controllers
{
   
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class StripeWebhookController : ControllerBase
    {
        private readonly IPaymentTransactionService _transactionService;
        private readonly ISubscriptionService       _subscriptionService;
        private readonly IPaymentGatewayService     _paymentGatewayService;
        private readonly ILogger<StripeWebhookController> _logger;
        private readonly string _webhookSecret;

        public StripeWebhookController(
            IPaymentTransactionService transactionService,
            ISubscriptionService subscriptionService,
            IPaymentGatewayService paymentGatewayService,
            ILogger<StripeWebhookController> logger,
            IConfiguration config)
        {
            _transactionService    = transactionService;
            _subscriptionService   = subscriptionService;
            _paymentGatewayService = paymentGatewayService;
            _logger                = logger;
            _webhookSecret         = config["Stripe:WebhookSecret"]
                ?? throw new InvalidOperationException("Stripe:WebhookSecret is not configured.");
        }

        [HttpPost]
        public async Task<IActionResult> HandleWebhook()
        {
            string json;
            using (var reader = new StreamReader(HttpContext.Request.Body))
            {
                json = await reader.ReadToEndAsync();
            }

            Event stripeEvent;
            try
            {
                var signatureHeader = Request.Headers["Stripe-Signature"].ToString();
                stripeEvent = _paymentGatewayService.ConstructStripeEvent(json, signatureHeader, _webhookSecret);
            }
            catch (StripeException ex)
            {
                _logger.LogWarning("Stripe webhook signature verification failed: {Message}", ex.Message);
                return BadRequest(new { error = "Webhook signature verification failed.", details = ex.Message });
            }

            _logger.LogInformation("Received Stripe event: {EventType} ({EventId})", stripeEvent.Type, stripeEvent.Id);

            try
            {
                switch (stripeEvent.Type)
                {
                    case "checkout.session.completed":
                        await HandleCheckoutSessionCompleted(stripeEvent);
                        break;

                    case "checkout.session.async_payment_failed":
                        await HandleCheckoutSessionPaymentFailed(stripeEvent);
                        break;

                    case "invoice.payment_failed":
                        await HandleInvoicePaymentFailed(stripeEvent);
                        break;

                    case "customer.subscription.deleted":
                        await HandleSubscriptionDeleted(stripeEvent);
                        break;

                    default:
                        _logger.LogDebug("Unhandled Stripe event type: {EventType}", stripeEvent.Type);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling Stripe event {EventType}", stripeEvent.Type);
                return StatusCode(500, new { error = "Internal error processing webhook.", details = ex.Message });
            }

            // Always return 200 OK quickly — Stripe retries on non-200 responses.
            return Ok();
        }

        // ─── Private handlers ────────────────────────────────────────────────────────

        private async Task HandleCheckoutSessionCompleted(Event stripeEvent)
        {
            var session = stripeEvent.Data.Object as Session;
            if (session == null) return;

            // Determine if this was a subscription or one-off payment checkout
            if (session.Mode == "subscription")
            {
                // Extract TenantId from metadata (set when we created the session)
                if (!session.Metadata.TryGetValue("tenantId", out var tenantIdStr)
                    || !int.TryParse(tenantIdStr, out var tenantId))
                {
                    _logger.LogWarning("checkout.session.completed: missing tenantId metadata on session {SessionId}", session.Id);
                    return;
                }

                // Retrieve the full subscription object from Stripe to get PriceId + period end
                var subscriptionService = new Stripe.SubscriptionService();
                var subscription = await subscriptionService.GetAsync(session.SubscriptionId);

                // Map the Stripe Price to a local SubscriptionPlan record
                var stripePriceId = subscription.Items.Data.FirstOrDefault()?.Price?.Id ?? string.Empty;
                var plan          = await _subscriptionService.GetPlanByStripePriceIdAsync(stripePriceId);

                if (plan == null)
                {
                    _logger.LogError(
                        "checkout.session.completed: no SubscriptionPlan found for StripePriceId={PriceId}. " +
                        "Ensure you have seeded plans matching your Stripe dashboard.", stripePriceId);
                    return;
                }

                var periodEnd = subscription.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd 
                    ?? DateTime.UtcNow.AddMonths(1);

                await _subscriptionService.ActivateSubscriptionAsync(
                    tenantId,
                    session.CustomerId,
                    subscription.Id,
                    plan.Id,
                    periodEnd);

                _logger.LogInformation(
                    "Tenant {TenantId} subscription activated. Plan={PlanName}, PeriodEnd={PeriodEnd}",
                    tenantId, plan.Name, periodEnd);
            }
            else if (session.Mode == "payment")
            {
                // Invoice (one-off) payment succeeded
                await _transactionService.MarkPaymentSuccessAsync(session.Id);
            }
        }

        private async Task HandleCheckoutSessionPaymentFailed(Event stripeEvent)
        {
            var session = stripeEvent.Data.Object as Session;
            if (session == null) return;

            await _transactionService.MarkPaymentFailedAsync(session.Id, "Payment failed asynchronously.");
        }

        private async Task HandleInvoicePaymentFailed(Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Stripe.Invoice;
            
            // In Stripe.net v50+, SubscriptionId is moved to the line items
            var subscriptionId = invoice?.Lines?.Data?.FirstOrDefault()?.SubscriptionId 
                                 ?? invoice?.RawJObject?["subscription"]?.ToString();
                                 
            if (string.IsNullOrEmpty(subscriptionId)) return;

            await _subscriptionService.MarkPastDueAsync(subscriptionId);

            _logger.LogWarning(
                "Invoice payment failed for subscription {SubscriptionId} — status set to PastDue.",
                subscriptionId);
        }

        private async Task HandleSubscriptionDeleted(Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null) return;

            await _subscriptionService.CancelSubscriptionAsync(subscription.Id);

            _logger.LogInformation(
                "Subscription {SubscriptionId} canceled.", subscription.Id);
        }
    }
}