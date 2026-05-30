using System;

namespace MytechERP.domain.Entities.CRM
{
    public class MeetingMinutesExecutionAttendee
    {
        public int Id { get; set; }
        
        public int MeetingMinutesExecutionId { get; set; }
        public MeetingMinutesExecution? Meeting { get; set; }
        
        public string EmployeeIdStr { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        
        public string EmployeeStatus { get; set; } = string.Empty; // present, absent, excused
    }
}
