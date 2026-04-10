using MytechERP.domain.Common;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;

namespace MytechERP.domain.Entities.sales
{
    public class SiteVisit : BaseEntity, ISyncableEntity
    {
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        
        public int SalesLeadId { get; set; }
        public SalesLead? SalesLead { get; set; }
        
        public int VisitNumber { get; set; }
        
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        
        public double? StartLatitude { get; set; }
        public double? StartLongitude { get; set; }
        
        public double? EndLatitude { get; set; }
        public double? EndLongitude { get; set; }
        
        public string MeetingNotes { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<VisitPhoto> Photos { get; set; } = new List<VisitPhoto>();
    }
}
