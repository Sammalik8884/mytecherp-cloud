using System;
using System.Collections.Generic;
using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.CRM
{
    public class ProjectSpotCheck : BaseEntity, ISyncableEntity
    {
        public int SiteId { get; set; }
        public Site? Site { get; set; }

        public string CreatedByUserId { get; set; } = string.Empty;
        public AppUser? CreatedByUser { get; set; }
        
        public string? UploadedFiles { get; set; } // JSON array of file URLs or comma separated

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }

        public ICollection<ProjectSpotCheckItem> Items { get; set; } = new List<ProjectSpotCheckItem>();
    }
}
