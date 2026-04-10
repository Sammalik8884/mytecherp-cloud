using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Sales
{
    public class SiteVisitDto
    {
        public int Id { get; set; }
        public int SalesLeadId { get; set; }
        public int VisitNumber { get; set; }
        
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        
        public double? StartLatitude { get; set; }
        public double? StartLongitude { get; set; }
        
        public double? EndLatitude { get; set; }
        public double? EndLongitude { get; set; }
        
        public string MeetingNotes { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        
        public List<VisitPhotoDto> Photos { get; set; } = new List<VisitPhotoDto>();
    }
}
