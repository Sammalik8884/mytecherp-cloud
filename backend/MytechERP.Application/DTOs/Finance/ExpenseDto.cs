using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Finance
{
    public class ExpenseDto
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public int AmountRequestFormId { get; set; }
        public string ArfNumber { get; set; } = string.Empty;
        public decimal TotalExpenseAmount { get; set; }
        public decimal ArfReleasedAmount { get; set; }
        public string CreatedByEmail { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<ExpenseItemDto> Items { get; set; } = new List<ExpenseItemDto>();
    }

    public class ExpenseItemDto
    {
        public int Id { get; set; }
        public DateTime ExpenseDate { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeDesignation { get; set; } = string.Empty;
        public string ExpenseType { get; set; } = string.Empty;
        public string DescriptionItems { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
    }

    public class CreateExpenseDto
    {
        public int SiteId { get; set; }
        public int AmountRequestFormId { get; set; }
        public List<CreateExpenseItemDto> Items { get; set; } = new List<CreateExpenseItemDto>();
    }

    public class CreateExpenseItemDto
    {
        public DateTime ExpenseDate { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeDesignation { get; set; } = string.Empty;
        public string ExpenseType { get; set; } = string.Empty;
        public string DescriptionItems { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
    }
}
