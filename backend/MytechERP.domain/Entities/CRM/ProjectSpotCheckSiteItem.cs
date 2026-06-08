using System;
using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;

namespace MytechERP.domain.Entities.CRM
{
    public class ProjectSpotCheckSiteItem : BaseEntity, ISyncableEntity
    {
        public int Id { get; set; }
        public int ProjectSpotCheckSiteId { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string CreatedByUserId { get; set; } = string.Empty;
        
        public string ItemText { get; set; } = string.Empty;
        public bool IsYes { get; set; } // We use IsYes to represent the single Yes/No checkbox
        public bool IsNA { get; set; }
        public string? Comments { get; set; }

        public virtual ProjectSpotCheckSite ProjectSpotCheckSite { get; set; }
    }
}
