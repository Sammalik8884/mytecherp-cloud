using MytechERP.domain.Common;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.Procurement
{
    public class ProcurementRequestItem : BaseEntity
    {
        public int ProcurementRequestId { get; set; }
        
        [ForeignKey("ProcurementRequestId")]
        public ProcurementRequest ProcurementRequest { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string ItemName { get; set; } = string.Empty;

        [Required]
        public decimal Quantity { get; set; }

        [MaxLength(500)]
        public string? Reason { get; set; }
    }
}
