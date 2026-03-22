using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Quotations
{
    public class CreateQuotationItemDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
      
        public int Quantity { get; set; }

        
        public decimal? ManualCommissionPct { get; set; }

        
       
    }
}