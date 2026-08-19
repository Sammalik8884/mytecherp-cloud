using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;

namespace MytechERP.domain.Quotations
{
    public class SupplyQuotation : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public string QuoteNumber { get; set; } = string.Empty;
        public DateTime QuoteDate { get; set; }
        
        public string QuotationFor { get; set; } = string.Empty;
        public string RevisionNumber { get; set; } = string.Empty;

        public string HeaderToName { get; set; } = string.Empty;
        public string HeaderDesignation { get; set; } = string.Empty;
        public string HeaderCompany { get; set; } = string.Empty;
        public string HeaderLocation { get; set; } = string.Empty;
        
        public string? TermsAndConditionsJson { get; set; }
        
        public string CreatedByUserId { get; set; } = string.Empty;
        
        // Storing list of supply columns as JSON, e.g. ["Supply-1", "Supply-2"]
        public string SupplyColumnsJson { get; set; } = "[]"; 
        
        public virtual ICollection<SupplyQuotationItem> Items { get; set; } = new List<SupplyQuotationItem>();
    }
}
