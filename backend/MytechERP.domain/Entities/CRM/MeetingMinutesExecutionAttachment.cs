using System;

namespace MytechERP.domain.Entities.CRM
{
    public class MeetingMinutesExecutionAttachment
    {
        public int Id { get; set; }
        
        public int MeetingMinutesExecutionId { get; set; }
        public MeetingMinutesExecution? Meeting { get; set; }
        
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
    }
}
