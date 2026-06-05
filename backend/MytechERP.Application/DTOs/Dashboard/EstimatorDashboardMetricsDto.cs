using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Dashboard
{
    public class RecentQuotationDto
    {
        public int Id { get; set; }
        public string QuotationNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public decimal GrandTotal { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class EstimatorDashboardMetricsDto
    {
        // ── KPI Cards ──────────────────────────────────────────────────
        public int TotalQuotations { get; set; }
        public decimal TotalQuotationValue { get; set; }
        public int PendingQuotations { get; set; }
        public int ApprovedQuotations { get; set; }

        // ── Chart Series ───────────────────────────────────────────────
        public List<ChartDataPoint> QuotationsByStatus { get; set; } = new();
        public List<ChartDataPoint> QuotationValueOverTime { get; set; } = new();

        // ── Recent Quotations ──────────────────────────────────────────
        public List<RecentQuotationDto> RecentQuotations { get; set; } = new();
    }
}
