using MytechERP.domain.Common;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Enums;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Quotations;
using System;
using System.Collections.Generic;

namespace MytechERP.domain.Entities.sales
{
    public class SalesLead : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public string LeadNumber { get; set; } = string.Empty;
        
        public int SiteId { get; set; }
        public Site? Site { get; set; }
        
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        
        public string SalesmanUserId { get; set; } = string.Empty;
        public AppUser? SalesmanUser { get; set; }
        
        public string? SalespersonSignatureName { get; set; }
        
        public LeadStatus Status { get; set; } = LeadStatus.New;
        public string Notes { get; set; } = string.Empty;
        
        public string? BOQFileUrl { get; set; }
        public string? DrawingsFileUrl { get; set; }
        
        public int? QuotationId { get; set; }
        public Quotation? Quotation { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<SiteVisit> SiteVisits { get; set; } = new List<SiteVisit>();
    }
}
