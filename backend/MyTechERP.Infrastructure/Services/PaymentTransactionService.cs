using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.Finance;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class PaymentTransactionService : IPaymentTransactionService
    {
        private readonly ApplicationDbContext _context;
        private readonly IPaymentGatewayService _gateway;

        public PaymentTransactionService(ApplicationDbContext context, IPaymentGatewayService gateway)
        {
            _context = context;
            _gateway = gateway;
        }

        public async Task<string> InitiatePaymentAsync(int invoiceId, decimal amount, string email)
        {
            var transaction = new PaymentTransaction
            {
                InvoiceId = invoiceId,
                Amount = amount,
                Provider = PaymentProvider.Stripe,
                Status = PaymentStatus.Pending,
                ReferenceNumber = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}"
            };

            _context.PaymentTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            var request = new PaymentRequestDto
            {
                InvoiceId = invoiceId,
                Amount = amount,
                CustomerEmail = email,
                Description = $"Payment for Invoice #{invoiceId}"
            };

            var gatewayResponse = await _gateway.CreateCheckoutSessionAsync(request);

            if (!gatewayResponse.IsSuccess)
            {
                transaction.Status = PaymentStatus.Failed;
                transaction.ErrorMessage = gatewayResponse.ErrorMessage;
                await _context.SaveChangesAsync();
                throw new Exception("Payment Gateway Failed: " + gatewayResponse.ErrorMessage);
            }

            transaction.GatewayTransactionId = gatewayResponse.GatewayTransactionId;
            await _context.SaveChangesAsync();

            return gatewayResponse.CheckoutUrl;
        }
        public async Task MarkPaymentSuccessAsync(string gatewayTransactionId)
        {
            // 1. Find the pending transaction using the Stripe Session ID
            var transaction = await _context.PaymentTransactions
                .FirstOrDefaultAsync(t => t.GatewayTransactionId == gatewayTransactionId);

            if (transaction == null) return; // Transaction not found, ignore

            // 2. Update Transaction Status
            transaction.Status = PaymentStatus.Completed;
            transaction.ProcessedAt = DateTime.UtcNow;

            // 3. Find the connected Invoice and mark it Paid
            var invoice = await _context.Invoices.FindAsync(transaction.InvoiceId);
            if (invoice != null)
            {
                invoice.Status = InvoiceStatus.Paid;
                invoice.AmountPaid = transaction.Amount;
            }

            await _context.SaveChangesAsync();
        }

        public async Task MarkPaymentFailedAsync(string gatewayTransactionId, string errorMessage)
        {
            var transaction = await _context.PaymentTransactions
                .FirstOrDefaultAsync(t => t.GatewayTransactionId == gatewayTransactionId);

            if (transaction == null) return;

            transaction.Status = PaymentStatus.Failed;
            transaction.ErrorMessage = errorMessage;
            transaction.ProcessedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
    }
}
