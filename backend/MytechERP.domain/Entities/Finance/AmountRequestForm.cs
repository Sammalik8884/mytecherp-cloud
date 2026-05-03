using MytechERP.domain.Common;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MytechERP.domain.Entities.Finance
{
    public class AmountRequestForm : BaseEntity, ISyncableEntity
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string ArfNumber { get; set; } = string.Empty;

        // Employee Section
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeEmail { get; set; } = string.Empty;
        public decimal AdvanceRequested { get; set; }
        public string AccountDetail { get; set; } = string.Empty;
        public DateTime? DateOfFundRequired { get; set; }

        // Personal / Office Use Section
        public int? SiteId { get; set; }
        public Site? Site { get; set; }
        public string CustomSiteName { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string PurposeOfAdvance { get; set; } = string.Empty;

        // Approvals Workflow Status
        // PendingDirector, PendingCEO, PendingAccounts, Released, Rejected
        public string Status { get; set; } = "PendingDirector";

        // Director Approval Section
        public string? DirectorName { get; set; }
        public DateTime? DirectorApprovalDate { get; set; }
        public string? DirectorComment { get; set; }

        // CEO Approval Section
        public string? CeoName { get; set; }
        public DateTime? CeoApprovalDate { get; set; }
        public string? CeoComment { get; set; }

        // For Accounts Use Only Section
        public DateTime? AccountsDateOfEntry { get; set; }
        public DateTime? AccountsDateOfFundReleased { get; set; }
        public decimal? AccountsReleasedAmount { get; set; }
        public string? AccountsRemarks { get; set; }

        // Released Payments Detail (One-to-Many mapping)
        public ICollection<AmountRequestPayment> Payments { get; set; } = new List<AmountRequestPayment>();
    }

    public class AmountRequestPayment : BaseEntity
    {
        public int AmountRequestFormId { get; set; }
        public AmountRequestForm AmountRequestForm { get; set; } = null!;

        public DateTime? ReleasedDate { get; set; }
        public decimal ReleasedAmount { get; set; }
        public string ReceivedBy { get; set; } = string.Empty;
        public string ModeOfPayment { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }
}
