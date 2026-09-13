using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.sales
{
    public class SalesInvoice : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        
        public string CustomerName { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        
        public string SiteName { get; set; } = string.Empty;
        public string SiteNtn { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string ScopeOfWork { get; set; } = string.Empty;
        
        public string PoRef { get; set; } = string.Empty;
        public string SesRef { get; set; } = string.Empty;
        public string MyTechNtnRef { get; set; } = "7600035-3";
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal GstPercentage { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal GstAmount { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; }
        
        public string AmountInWords { get; set; } = string.Empty;
        
        public string CreatedByUserId { get; set; } = string.Empty;
        
        public virtual ICollection<SalesInvoiceItem> Items { get; set; } = new List<SalesInvoiceItem>();
    }
}
