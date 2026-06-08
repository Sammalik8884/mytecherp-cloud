using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;

namespace MytechERP.domain.Entities.CRM
{
    public class IncidentRecord : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        
        public int SiteId { get; set; }
        public Site? Site { get; set; }
        
        public string Doc { get; set; } = string.Empty;
        public string Issue { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public ICollection<IncidentRecordItem> Items { get; set; }

        public IncidentRecord()
        {
            Items = new List<IncidentRecordItem>();
        }
    }
}
