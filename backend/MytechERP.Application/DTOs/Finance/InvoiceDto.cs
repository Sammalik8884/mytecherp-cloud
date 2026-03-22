using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Finance
{
    public class InvoiceDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public int? QuotationId { get; set; }
        public int? WorkOrderId { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AmountPaid { get; set; }
        public int Status { get; set; }
        public string? StatusString { get; set; }

        public List<InvoiceItemDto> Items { get; set; } = new List<InvoiceItemDto>();
    }
}
