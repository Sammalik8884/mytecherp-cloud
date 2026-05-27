using System;
using System.Collections.Generic;
using MytechERP.domain.Entities.System;
using MytechERP.domain.Entities;
using MytechERP.domain;

namespace MytechERP.domain.Entities.CRM
{
    public class MaterialReceivingForm
    {
        public int Id { get; set; }
        
        // Both can be optional based on user preference
        public int? SiteId { get; set; }
        public Site? Site { get; set; }
        
        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }
        
        public string? Location { get; set; } // e.g., Lahore, Karachi
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public string CreatedByUserId { get; set; } = string.Empty;
        public AppUser? CreatedByUser { get; set; }
        
        public bool IsDeleted { get; set; }
        
        public List<MaterialReceivingItem> Items { get; set; } = new List<MaterialReceivingItem>();
    }
}
