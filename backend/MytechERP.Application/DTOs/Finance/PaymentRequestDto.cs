using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.Finance
{
    public class PaymentRequestDto
    {
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public string CustomerEmail { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
