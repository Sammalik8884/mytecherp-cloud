using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Procurement
{
    public class ProcurementRequestDto
    {
        public int Id { get; set; }
        public string ProcurementNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string SupervisorName { get; set; } = string.Empty;
        public string SupervisorEmail { get; set; } = string.Empty;
        public int? SiteId { get; set; }
        public string Status { get; set; } = string.Empty;
        
        public string? RegionalHeadEmail { get; set; }
        public string? RegionalHeadRemarks { get; set; }
        public DateTime? RegionalHeadApprovalDate { get; set; }
        
        public string? PdEmail { get; set; }
        public string? PdRemarks { get; set; }
        public DateTime? PdApprovalDate { get; set; }
        public string? ProcurementHeadEmail { get; set; }
        public int? AmountRequestFormId { get; set; }
        public string? AssignedExecutiveEmail { get; set; }
        public DateTime? AssignedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? DeliveryNoteText { get; set; }
        public List<string> DeliveryNoteDocuments { get; set; } = new List<string>();
        public List<ProcurementRequestItemDto> Items { get; set; } = new List<ProcurementRequestItemDto>();
        public List<ProcurementQuoteDto> Quotes { get; set; } = new List<ProcurementQuoteDto>();
        public bool IsArfApproved { get; set; }
    }

    public class ProcurementQuoteDto
    {
        public int Id { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public string? CityName { get; set; }
        public string? ContactPerson { get; set; }
        public string? ContactNumber { get; set; }
        public string? BankAccountName { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public decimal TotalAmount { get; set; }
        public bool IsSelected { get; set; }
        public DateTime SubmittedAt { get; set; }
        public List<ProcurementQuoteItemDto> QuoteItems { get; set; } = new List<ProcurementQuoteItemDto>();
    }

    public class ProcurementQuoteItemDto
    {
        public int Id { get; set; }
        public int ProcurementRequestItemId { get; set; }
        public decimal UnitRate { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class ProcurementRequestItemDto
    {
        public int Id { get; set; }
        public int ProcurementRequestId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string? Reason { get; set; }
    }
}
