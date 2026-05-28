using System;

namespace MytechERP.domain.Entities.CRM
{
    public class MomAttendee
    {
        public int Id { get; set; }
        
        public int MomMeetingId { get; set; }
        public MomMeeting? Meeting { get; set; }
        
        public string EmployeeIdStr { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        
        public string EmployeeStatus { get; set; } = string.Empty; // Present, Absent, Excused
    }
}
