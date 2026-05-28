using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace MytechERP.Application.DTOs.CRM
{
    public class MomAttendeeDto
    {
        public int? Id { get; set; }
        public string EmployeeIdStr { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeStatus { get; set; } = string.Empty;
    }

    public class MomAttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string DownloadUrl { get; set; } = string.Empty;
    }

    public class MomMeetingDto
    {
        public int Id { get; set; }
        public int? SiteId { get; set; }
        public string? SiteName { get; set; }
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
        public string CreatedByUserName { get; set; } = string.Empty;

        public List<MomAttendeeDto> Attendees { get; set; } = new();
        public List<MomAttachmentDto> Attachments { get; set; } = new();
    }

    public class CreateMomMeetingDto
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

        public string AttendeesJson { get; set; } = string.Empty; // Sent as JSON string because of FormData
        public List<IFormFile> Files { get; set; } = new List<IFormFile>();
    }
}
