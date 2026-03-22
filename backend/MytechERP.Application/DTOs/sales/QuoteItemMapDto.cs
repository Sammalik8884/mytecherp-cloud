using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.sales
{
    public class QuoteItemMapDto
    {
        public int ProductId { get; set; }   
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string Description { get; set; } = "Repair Part";
    }
}
