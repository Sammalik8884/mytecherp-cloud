using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Sales
{
    public class StartSiteVisitDto
    {
        [Required]
        public double StartLatitude { get; set; }
        
        [Required]
        public double StartLongitude { get; set; }
    }
}
