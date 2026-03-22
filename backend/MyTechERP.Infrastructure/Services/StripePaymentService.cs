using Microsoft.Extensions.Configuration;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
using Stripe;
using Stripe.Checkout;

namespace MyTechERP.Infrastructure.Services
{
    public class StripePaymentService : IPaymentGatewayService
    {
        private readonly IConfiguration _config;

        public StripePaymentService(IConfiguration config)
        {
            _config = config;
            StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
        }

        // ─── One-off Invoice Payment ────────────────────────────────────────────────

        public async Task<PaymentResponseDto> CreateCheckoutSessionAsync(PaymentRequestDto request)
        {
            try
            {
                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string> { "card" },
                    CustomerEmail = request.CustomerEmail,
                    LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions
                        {
                            PriceData = new SessionLineItemPriceDataOptions
                            {
                                UnitAmount = (long)(request.Amount * 100),
                                Currency = request.Currency.ToLower(),
                                ProductData = new SessionLineItemPriceDataProductDataOptions
                                {
                                    Name = request.Description,
                                },
                            },
                            Quantity = 1,
                        },
                    },
                    Mode = "payment",
                    ClientReferenceId = request.InvoiceId.ToString(),
                    SuccessUrl = _config["Stripe:SuccessUrl"] ?? "https://your-erp.com/payment/success?session_id={CHECKOUT_SESSION_ID}",
                    CancelUrl  = _config["Stripe:CancelUrl"]  ?? "https://your-erp.com/payment/cancel",
                };

                var service = new SessionService();
                Session session = await service.CreateAsync(options);

                return new PaymentResponseDto
                {
                    IsSuccess = true,
                    GatewayTransactionId = session.Id,
                    CheckoutUrl = session.Url
                };
            }
            catch (Exception ex)
            {
                return new PaymentResponseDto { IsSuccess = false, ErrorMessage = ex.Message };
            }
        }

        // ─── Recurring Subscription Checkout ────────────────────────────────────────

        /// <summary>
        /// Creates a Stripe Checkout Session in "subscription" mode.
        /// The TenantId is stored BOTH in ClientReferenceId AND in session metadata
        /// so the webhook handler can unambiguously identify which tenant subscribed.
        /// </summary>
        public async Task<PaymentResponseDto> CreateSubscriptionCheckoutAsync(
            int tenantId,
            string customerEmail,
            string stripePriceId)
        {
            try
            {
                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string> { "card" },
                    CustomerEmail = customerEmail,
                    LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions
                        {
                            Price    = stripePriceId,
                            Quantity = 1,
                        },
                    },
                    Mode              = "subscription",
                    ClientReferenceId = tenantId.ToString(),
                    Metadata = new Dictionary<string, string>
                    {
                        { "tenantId", tenantId.ToString() }
                    },
                    SuccessUrl = _config["Stripe:SubscriptionSuccessUrl"] ?? "https://your-erp.com/subscription/success?session_id={CHECKOUT_SESSION_ID}",
                    CancelUrl  = _config["Stripe:SubscriptionCancelUrl"]  ?? "https://your-erp.com/subscription/cancel",
                };

                var service = new SessionService();
                Session session = await service.CreateAsync(options);

                return new PaymentResponseDto
                {
                    IsSuccess = true,
                    GatewayTransactionId = session.Id,
                    CheckoutUrl = session.Url
                };
            }
            catch (Exception ex)
            {
                return new PaymentResponseDto { IsSuccess = false, ErrorMessage = ex.Message };
            }
        }

        // ─── Webhook Verification ────────────────────────────────────────────────────

        /// <summary>
        /// Verifies the Stripe-Signature header using the raw request body.
        /// Returns a fully-constructed Stripe Event on success.
        /// Throws StripeException on failure — let it propagate as a 400.
        /// </summary>
        public Event ConstructStripeEvent(string payload, string signatureHeader, string webhookSecret)
        {
            return EventUtility.ConstructEvent(payload, signatureHeader, webhookSecret);
        }
    }
}
