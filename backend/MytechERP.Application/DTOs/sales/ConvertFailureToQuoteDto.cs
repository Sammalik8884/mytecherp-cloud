using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs.sales
{
    public class ConvertFailureToQuoteDto
    {
        public int WorkOrderId { get; set; }

        public List<int> FailedChecklistIds { get; set; } = new();

        public List<QuoteItemMapDto> Items { get; set; } = new();
    }
}
