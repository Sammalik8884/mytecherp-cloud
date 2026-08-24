using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Quotations
{
    public class SupplyQuotationItem : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public int SupplyQuotationId { get; set; }
        public virtual SupplyQuotation? SupplyQuotation { get; set; }
        
        public int SNo { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; }
        
        public string Unit { get; set; } = string.Empty;
        
        // JSON object storing rate per column: e.g. {"Supply-1": 100, "Supply-2": 150}
        public string RatesJson { get; set; } = "{}";
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }
    }
}
