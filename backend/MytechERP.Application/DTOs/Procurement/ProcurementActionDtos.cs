using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Procurement
{
    public class CreateProcurementRequestDto
    {
        public int? SiteId { get; set; }

        public List<CreateProcurementItemDto> Items { get; set; } = new List<CreateProcurementItemDto>();
    }

    public class CreateProcurementItemDto
    {
        [Required]
        [MaxLength(200)]
        public string ItemName { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Quantity { get; set; }

        [MaxLength(500)]
        public string? Reason { get; set; }
    }

    public class CompleteProcurementDto
    {
        public string? DeliveryNoteText { get; set; }
        public List<string> DeliveryNoteDocuments { get; set; } = new List<string>();
    }

    public class PdReviewProcurementDto
    {
        [Required]
        public bool IsApproved { get; set; }
        public string? Remarks { get; set; }
    }

    public class AssignProcurementExecutiveDto
    {
        [Required]
        public string ExecutiveEmail { get; set; } = string.Empty;
    }
}
