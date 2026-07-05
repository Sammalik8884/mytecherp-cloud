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

    public class RegionalHeadReviewDto
    {
        [Required]
        public bool IsApproved { get; set; }
        public string? Remarks { get; set; }
        public List<UpdateProcurementItemDto> UpdatedItems { get; set; } = new List<UpdateProcurementItemDto>();
    }

    public class UpdateProcurementItemDto
    {
        public int? ItemId { get; set; }
        [Required]
        [MaxLength(200)]
        public string ItemName { get; set; } = string.Empty;
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Quantity { get; set; }
        [MaxLength(500)]
        public string? Reason { get; set; }
    }

    public class SubmitVendorQuotesDto
    {
        [Required]
        public List<VendorQuoteDto> Quotes { get; set; } = new List<VendorQuoteDto>();
    }

    public class VendorQuoteDto
    {
        [Required]
        public string VendorName { get; set; } = string.Empty;
        public string? CityName { get; set; }
        public string? ContactPerson { get; set; }
        public string? ContactNumber { get; set; }
        public string? BankAccountName { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public List<VendorQuoteItemDto> Items { get; set; } = new List<VendorQuoteItemDto>();
    }

    public class VendorQuoteItemDto
    {
        public int ProcurementRequestItemId { get; set; }
        public decimal UnitRate { get; set; }
    }

    public class AcceptProcurementDto
    {
        [Required]
        public bool IsAccepted { get; set; }
        public string? Remarks { get; set; }
    }
}
