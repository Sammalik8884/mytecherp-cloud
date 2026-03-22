using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IPaymentTransactionService
    {
        Task<string> InitiatePaymentAsync(int invoiceId, decimal amount, string email);
        Task MarkPaymentSuccessAsync(string gatewayTransactionId);
        Task MarkPaymentFailedAsync(string gatewayTransactionId, string errorMessage);
    }
}
