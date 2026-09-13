using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.sales
{
    public class SalesInvoiceItem : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public int SalesInvoiceId { get; set; }
        public virtual SalesInvoice? SalesInvoice { get; set; }
        
        public int SNo { get; set; }
        public string Description { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; }
        
        public string Unit { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Rate { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
    }
}
