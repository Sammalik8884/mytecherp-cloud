using System;
using System.Collections.Generic;

namespace MytechERP.domain.Entities.CRM
{
    public class ProjectTechnicalHandover
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int SiteId { get; set; }
        public Site Site { get; set; }
        
        public int? CustomerId { get; set; }
        public Customer Customer { get; set; }
        
        public int? SecondaryCustomerId { get; set; }
        public Customer SecondaryCustomer { get; set; }
        
        public string CreatedByUserId { get; set; }
        public AppUser CreatedByUser { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; }
        
        public ICollection<ProjectTechnicalHandoverAttachment> Attachments { get; set; } = new List<ProjectTechnicalHandoverAttachment>();
    }
}
