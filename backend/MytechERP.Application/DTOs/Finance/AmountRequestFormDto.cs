using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Finance
{
    public class AmountRequestFormDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ArfNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeEmail { get; set; } = string.Empty;
        public decimal AdvanceRequested { get; set; }
        public string AccountDetail { get; set; } = string.Empty;
        public DateTime? DateOfFundRequired { get; set; }

        public int? SiteId { get; set; }
        public string? SiteName { get; set; }
        public int? OfficeId { get; set; }
        public string? OfficeName { get; set; }
        public string CustomSiteName { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string PurposeOfAdvance { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string? DirectorName { get; set; }
        public DateTime? DirectorApprovalDate { get; set; }
        public string? DirectorComment { get; set; }

        public string? CeoName { get; set; }
        public DateTime? CeoApprovalDate { get; set; }
        public string? CeoComment { get; set; }

        public DateTime? AccountsDateOfEntry { get; set; }
        public DateTime? AccountsDateOfFundReleased { get; set; }
        public decimal? AccountsReleasedAmount { get; set; }
        public string? AccountsRemarks { get; set; }

        public List<AmountRequestPaymentDto> Payments { get; set; } = new List<AmountRequestPaymentDto>();
        public List<string> Attachments { get; set; } = new List<string>();
    }

    public class CreateAmountRequestFormDto
    {
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeEmail { get; set; } = string.Empty;
        public decimal AdvanceRequested { get; set; }
        public string AccountDetail { get; set; } = string.Empty;
        public DateTime? DateOfFundRequired { get; set; }

        public int? SiteId { get; set; }
        public int? OfficeId { get; set; }
        public string CustomSiteName { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string PurposeOfAdvance { get; set; } = string.Empty;
    }

    public class AmountRequestPaymentDto
    {
        public int Id { get; set; }
        public DateTime? ReleasedDate { get; set; }
        public decimal ReleasedAmount { get; set; }
        public string ReceivedBy { get; set; } = string.Empty;
        public string ModeOfPayment { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }

    public class CreateAmountRequestPaymentDto
    {
        public DateTime? ReleasedDate { get; set; }
        public decimal ReleasedAmount { get; set; }
        public string ReceivedBy { get; set; } = string.Empty;
        public string ModeOfPayment { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }

    public class ApproveAmountRequestDto
    {
        public string ApproverRole { get; set; } = string.Empty; // "Director" or "CEO"
        public string ApproverName { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public bool IsApproved { get; set; } // If false, reject
    }

    public class AccountsReleaseAmountDto
    {
        public DateTime? DateOfEntry { get; set; }
        public DateTime? DateOfFundReleased { get; set; }
        public decimal ReleasedAmount { get; set; }
        public string Remarks { get; set; } = string.Empty;
    }
}
