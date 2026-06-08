using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;

namespace MytechERP.domain.Entities.CRM
{
    public class ToolBoxTalk : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        
        public string DocumentNo { get; set; } = string.Empty;
        public string FormNo { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
        
        public int SiteId { get; set; }
        public Site? Site { get; set; }
        
        public string TbtPerformedBy { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string JobSupervisorName { get; set; } = string.Empty;
        public string QehsName { get; set; } = string.Empty;
        public string ProjectManagerName { get; set; } = string.Empty;
        
        public string SelectedTopics { get; set; } = "[]";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public ICollection<ToolBoxTalkAttendee> Attendees { get; set; }

        public ToolBoxTalk()
        {
            Attendees = new List<ToolBoxTalkAttendee>();
        }
    }
}
