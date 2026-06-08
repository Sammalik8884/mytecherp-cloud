using MytechERP.domain.Interfaces;
using System;

namespace MytechERP.domain.Entities.CRM
{
    public class ToolBoxTalkAttendee : ISyncableEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        
        public int ToolBoxTalkId { get; set; }
        public ToolBoxTalk? ToolBoxTalk { get; set; }
        
        public string EmployeeName { get; set; } = string.Empty;
        public string Status { get; set; } = "Present";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
    }
}
