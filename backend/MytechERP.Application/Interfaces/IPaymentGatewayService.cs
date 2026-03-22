using MytechERP.Application.DTOs.Finance;
using Stripe;

namespace MytechERP.Application.Interfaces
{
    public interface IPaymentGatewayService
    {
        /// <summary>Creates a one-off invoice payment checkout session (Mode = payment).</summary>
        Task<PaymentResponseDto> CreateCheckoutSessionAsync(PaymentRequestDto request);

        /// <summary>
        /// Creates a recurring subscription checkout session (Mode = subscription).
        /// TenantId is embedded in session metadata so the webhook can identify who subscribed.
        /// </summary>
        Task<PaymentResponseDto> CreateSubscriptionCheckoutAsync(
            int tenantId,
            string customerEmail,
            string stripePriceId);

        /// <summary>
        /// Verifies the Stripe-Signature header and returns the parsed Event object.
        /// Throws StripeException if verification fails — caller must return 400.
        /// </summary>
        Event ConstructStripeEvent(string payload, string signatureHeader, string webhookSecret);
    }
}
