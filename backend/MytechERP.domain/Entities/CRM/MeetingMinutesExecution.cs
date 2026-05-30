using System;
using System.Collections.Generic;
using MytechERP.domain.Entities.System;

namespace MytechERP.domain.Entities.CRM
{
    public class MeetingMinutesExecution
    {
        public int Id { get; set; }
        
        public int? SiteId { get; set; }
        public Site? Site { get; set; }
        
        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }
        
        public string MeetingTitle { get; set; } = string.Empty;
        public DateTime MeetingDate { get; set; }
        public string TimeFrom { get; set; } = string.Empty;
        public string TimeTo { get; set; } = string.Empty;
        
        public string Location { get; set; } = string.Empty;
        public string Organizer { get; set; } = string.Empty;
        public string MeetingType { get; set; } = string.Empty;
        
        public string Agenda { get; set; } = string.Empty;
        public string DiscussionPoints { get; set; } = string.Empty;
        public string DecisionsMade { get; set; } = string.Empty;
        public string ActionItems { get; set; } = string.Empty;
        public string ClosingNotes { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public string CreatedByUserId { get; set; } = string.Empty;
        public AppUser? CreatedByUser { get; set; }
        
        public bool IsDeleted { get; set; }
        
        public List<MeetingMinutesExecutionAttendee> Attendees { get; set; } = new List<MeetingMinutesExecutionAttendee>();
        public List<MeetingMinutesExecutionAttachment> Attachments { get; set; } = new List<MeetingMinutesExecutionAttachment>();
    }
}
