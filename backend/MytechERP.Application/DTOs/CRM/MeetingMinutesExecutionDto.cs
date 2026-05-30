using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.CRM
{
    public class MeetingMinutesExecutionDto
    {
        public int Id { get; set; }
        public int? SiteId { get; set; }
        public int TenantId { get; set; }
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
        
        public DateTime CreatedAt { get; set; }
        public string CreatedByUserId { get; set; } = string.Empty;
        public string CreatedByUserName { get; set; } = string.Empty;
        
        public List<MeetingMinutesExecutionAttendeeDto> Attendees { get; set; } = new List<MeetingMinutesExecutionAttendeeDto>();
        public List<MeetingMinutesExecutionAttachmentDto> Attachments { get; set; } = new List<MeetingMinutesExecutionAttachmentDto>();
    }

    public class MeetingMinutesExecutionAttendeeDto
    {
        public int Id { get; set; }
        public string EmployeeIdStr { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeStatus { get; set; } = string.Empty;
    }

    public class MeetingMinutesExecutionAttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
    }

    public class CreateMeetingMinutesExecutionDto
    {
        public int? SiteId { get; set; }
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
        
        // JSON string of List<MeetingMinutesExecutionAttendeeDto>
        public string AttendeesJson { get; set; } = "[]";
        
        public List<IFormFile> Attachments { get; set; } = new List<IFormFile>();
    }
}
