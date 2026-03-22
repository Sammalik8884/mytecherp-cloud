using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.Quotations
{
    public class UpdateQuotationRequest
    {
        public int CustomerId { get; set; } 
        public int? SiteId { get; set; }    
        public DateTime ValidUntil { get; set; }
        public string Currency { get; set; } = "PKR";

       
        public decimal GSTPercentage { get; set; }
        public decimal IncomeTaxPercentage { get; set; }
        public decimal Adjustment { get; set; } 

        public List<QuotationItemDto> Items { get; set; } = new();
    }
}
