using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.Finance
{
    public class PaymentResponseDto
    {
        public bool IsSuccess { get; set; }
        public string GatewayTransactionId { get; set; } = string.Empty;
        public string CheckoutUrl { get; set; } = string.Empty; 
        public string? ErrorMessage { get; set; }
    }
}
