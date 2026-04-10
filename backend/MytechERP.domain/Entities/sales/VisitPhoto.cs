using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;

namespace MytechERP.domain.Entities.sales
{
    public class VisitPhoto : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public int SiteVisitId { get; set; }
        public SiteVisit? SiteVisit { get; set; }
        
        public string PhotoUrl { get; set; } = string.Empty;
        public string? Caption { get; set; }
        
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
