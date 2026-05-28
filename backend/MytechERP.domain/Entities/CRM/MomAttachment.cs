using System;

namespace MytechERP.domain.Entities.CRM
{
    public class MomAttachment
    {
        public int Id { get; set; }
        
        public int MomMeetingId { get; set; }
        public MomMeeting? Meeting { get; set; }
        
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
    }
}
