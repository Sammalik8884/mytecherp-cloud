using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.SalesInvoices
{
    public class SalesInvoiceItemDto
    {
        public int Id { get; set; }
        public int SNo { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
    }

    public class SalesInvoiceDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string SiteNtn { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string ScopeOfWork { get; set; } = string.Empty;
        public string PoRef { get; set; } = string.Empty;
        public string SesRef { get; set; } = string.Empty;
        public string MyTechNtnRef { get; set; } = string.Empty;
        
        public decimal SubTotal { get; set; }
        public decimal GstPercentage { get; set; }
        public decimal GstAmount { get; set; }
        public decimal GrandTotal { get; set; }
        public string AmountInWords { get; set; } = string.Empty;
        public string CreatedByUserId { get; set; } = string.Empty;
        
        public List<SalesInvoiceItemDto> Items { get; set; } = new();
    }

    public class CreateSalesInvoiceItemDto
    {
        public int SNo { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
    }

    public class CreateSalesInvoiceDto
    {
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string SiteNtn { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string ScopeOfWork { get; set; } = string.Empty;
        public string PoRef { get; set; } = string.Empty;
        public string SesRef { get; set; } = string.Empty;
        public string MyTechNtnRef { get; set; } = "7600035-3";
        
        public decimal SubTotal { get; set; }
        public decimal GstPercentage { get; set; }
        public decimal GstAmount { get; set; }
        public decimal GrandTotal { get; set; }
        public string AmountInWords { get; set; } = string.Empty;
        
        public List<CreateSalesInvoiceItemDto> Items { get; set; } = new();
    }
}
