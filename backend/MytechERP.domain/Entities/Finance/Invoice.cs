using MytechERP.domain.Common;
using MytechERP.domain.Entities.CRM;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Entities.Finance
{
    public class Invoice : BaseEntity, MytechERP.domain.Interfaces.ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string InvoiceNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public int? QuotationId { get; set; }
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountPaid { get; set; } = 0;
        public int? WorkOrderId { get; set; }
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
        public virtual ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
        public int? SubscriptionId { get; set; }
    }

    public enum InvoiceStatus { Draft = 0, Issued = 1, Paid = 2, Overdue = 3, Cancelled = 4 }

}

