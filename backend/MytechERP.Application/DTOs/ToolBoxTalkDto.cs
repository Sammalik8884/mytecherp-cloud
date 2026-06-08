using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs
{
    public class ToolBoxTalkDto
    {
        public int Id { get; set; }
        public string DocumentNo { get; set; } = string.Empty;
        public string FormNo { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
        
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        
        public string TbtPerformedBy { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string JobSupervisorName { get; set; } = string.Empty;
        public string QehsName { get; set; } = string.Empty;
        public string ProjectManagerName { get; set; } = string.Empty;
        
        public string SelectedTopics { get; set; } = "[]";

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<ToolBoxTalkAttendeeDto> Attendees { get; set; } = new List<ToolBoxTalkAttendeeDto>();
    }

    public class ToolBoxTalkAttendeeDto
    {
        public int Id { get; set; }
        public int ToolBoxTalkId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Status { get; set; } = "Present";
        public DateTime CreatedAt { get; set; }
    }
}
