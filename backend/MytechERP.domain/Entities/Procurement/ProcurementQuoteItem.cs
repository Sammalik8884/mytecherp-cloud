using MytechERP.domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.Procurement
{
    public class ProcurementQuoteItem : BaseEntity
    {
        public int QuoteId { get; set; }

        [ForeignKey("QuoteId")]
        public ProcurementQuote Quote { get; set; } = null!;

        public int ProcurementRequestItemId { get; set; }

        [ForeignKey("ProcurementRequestItemId")]
        public ProcurementRequestItem RequestItem { get; set; } = null!;

        public decimal UnitRate { get; set; }
        
        public decimal LineTotal { get; set; }
    }
}
