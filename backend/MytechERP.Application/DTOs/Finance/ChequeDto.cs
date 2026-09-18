using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Finance
{
    public class ChequeDto
    {
        public int Id { get; set; }
        public string ChequeNumber { get; set; } = string.Empty;
        public decimal InitialAmount { get; set; }
        public decimal ReleasedAmount { get; set; }
        public decimal RemainingBalance { get; set; }
        public string PictureUrl { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateChequeDto
    {
        public string ChequeNumber { get; set; } = string.Empty;
        public decimal InitialAmount { get; set; }
        public string PictureUrl { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
    }

    public class UpdateChequeDto
    {
        public string? ChequeNumber { get; set; }
        public decimal? InitialAmount { get; set; }
        public string? PictureUrl { get; set; }
        public string? BankName { get; set; }
        public string? AccountName { get; set; }
        public string? AccountNumber { get; set; }
        public bool? IsActive { get; set; }
    }

    public class ChequeLedgerPaymentDto
    {
        public int PaymentId { get; set; }
        public int ArfId { get; set; }
        public string ArfNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public decimal ReleasedAmount { get; set; }
        public DateTime? ReleasedDate { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public string? PaymentSlipUrl { get; set; }
    }

    public class ChequeLedgerDto
    {
        public ChequeDto Cheque { get; set; } = null!;
        public List<ChequeLedgerPaymentDto> Payments { get; set; } = new();
    }
}
