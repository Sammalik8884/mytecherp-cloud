using System;
using System.Collections.Generic;
using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.CRM
{
    public class ProjectSpotCheckSite : BaseEntity, ISyncableEntity
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string CreatedByUserId { get; set; } = string.Empty;
        
        // Navigation properties
        public virtual Site Site { get; set; }
        public virtual ICollection<ProjectSpotCheckSiteItem> Items { get; set; } = new List<ProjectSpotCheckSiteItem>();
        
        // JSON string storing the uploaded files (array of URLs)
        public string? UploadedFiles { get; set; }
    }
}
