using MytechERP.domain.Common;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Enums;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Quotations
{
    public class Quotation : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string QuoteNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public int? SiteId { get; set; }
        public int? OpportunityId { get; set; }
        public DateTime ValidUntil { get; set; }
        public Customer? Customer { get; set; }
        public Site? Site { get; set; }
        public int? AssetId { get; set; }
        public Asset? Asset { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public virtual ICollection<QuotationItem> Items { get; set; } = new List<QuotationItem>();

        public QuotationStatus Status { get; set; } = QuotationStatus.Draft;
        public string? ReviewerComments { get; set; } 
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedByUserId { get; set; }
        public string Currency { get; set; } = "PKR";

        [Column(TypeName = "decimal(18,4)")]
        public decimal ExchangeRate { get; set; } = 1.0m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal GlobalCommissionPct { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; } 

        [Column(TypeName = "decimal(18,2)")]
        public decimal GSTPercentage { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GSTAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal IncomeTaxPercentage { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal IncomeTaxAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Adjustment { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public string Notes { get; set; }= string.Empty;
        public string CreatedByUserId { get; set; }=string.Empty;

        public string QuoteMode { get; set; } = "Local"; 
        public string SupplyColumnMode { get; set; } = "Both"; 
    }
}