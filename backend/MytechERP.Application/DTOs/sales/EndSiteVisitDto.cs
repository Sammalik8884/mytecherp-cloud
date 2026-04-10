using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Sales
{
    public class EndSiteVisitDto
    {
        [Required]
        public double EndLatitude { get; set; }
        
        [Required]
        public double EndLongitude { get; set; }
        
        public string MeetingNotes { get; set; } = string.Empty;
    }
}
