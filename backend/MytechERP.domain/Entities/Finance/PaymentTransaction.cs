using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.Finance
{
    public class PaymentTransaction : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public int InvoiceId { get; set; }

        public string ReferenceNumber { get; set; } = string.Empty;
        public string GatewayTransactionId { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";

        public PaymentProvider Provider { get; set; }
        public PaymentStatus Status { get; set; }

        public string? ErrorMessage { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }

    public enum PaymentStatus
    {
        Pending = 0,    
        Completed = 1,  
        Failed = 2,     
        Refunded = 3    
    }

    public enum PaymentProvider
    {
        Stripe = 1,
        Paddle = 2,
        BankTransfer = 3,
        Cash = 4
    }
}

