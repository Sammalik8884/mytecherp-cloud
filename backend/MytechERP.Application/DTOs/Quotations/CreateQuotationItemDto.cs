using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Quotations
{
    public class CreateQuotationItemDto
    {
        
        public int? ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
      
        public int Quantity { get; set; }

        
        public decimal? ManualCommissionPct { get; set; }

        public string ItemType { get; set; } = "Local";
        public string? ServiceName { get; set; }
        public decimal? ServicePrice { get; set; }

        
       
    }
}