using MytechERP.domain.Common;
using MytechERP.domain.Entities;
using MytechERP.domain.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Quotations
{
    public class QuotationItem : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }

        public int QuotationId { get; set; }
        public virtual Quotation? Quotation { get; set; }

       
        public int? ProductId { get; set; }
        public Product? Product { get; set; }

       
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCost { get; set; }

      
        [Column(TypeName = "decimal(18,2)")]
        public decimal MarginPercentage { get; set; }

       
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }
    }
}