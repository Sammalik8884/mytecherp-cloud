using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Sales
{
    public class CreateSalesLeadDto
    {
        [Required]
        public int SiteId { get; set; }
        
        [Required]
        public int CustomerId { get; set; }
        
        public string? SalesmanUserId { get; set; }
        
        public string Notes { get; set; } = string.Empty;
    }
}
