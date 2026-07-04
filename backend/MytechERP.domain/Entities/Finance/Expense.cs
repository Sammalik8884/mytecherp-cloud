using MytechERP.domain.Common;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Interfaces;
using System;
using System.Collections.Generic;

namespace MytechERP.domain.Entities.Finance
{
    public class Expense : BaseEntity, ISyncableEntity
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public int? SiteId { get; set; }
        public Site? Site { get; set; }

        public int? OfficeId { get; set; }
        public Office? Office { get; set; }

        public int? AmountRequestFormId { get; set; }
        public AmountRequestForm? AmountRequestForm { get; set; }

        public string CreatedByEmail { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected
        public string ReviewerComments { get; set; } = string.Empty;
        public string ReviewedByEmail { get; set; } = string.Empty;
        public DateTime? ReviewedAt { get; set; }

        public ICollection<ExpenseItem> Items { get; set; } = new List<ExpenseItem>();
    }

    public class ExpenseItem : BaseEntity
    {
        public int ExpenseId { get; set; }
        public Expense Expense { get; set; } = null!;

        public DateTime ExpenseDate { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeDesignation { get; set; } = string.Empty;
        public string ExpenseType { get; set; } = string.Empty;
        public string DescriptionItems { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public bool IsExcessItem { get; set; } = false;
        public string Remarks { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string AttachmentsJson { get; set; } = string.Empty;

        [global::System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public List<string> Attachments
        {
            get => string.IsNullOrEmpty(AttachmentsJson) ? new List<string>() : global::System.Text.Json.JsonSerializer.Deserialize<List<string>>(AttachmentsJson) ?? new List<string>();
            set => AttachmentsJson = global::System.Text.Json.JsonSerializer.Serialize(value);
        }
    }
}
