namespace MytechERP.Application.DTOs.Dashboard
{
    public class ChartDataPoint
    {
        public string Name { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public decimal? SecondaryValue { get; set; }
    }

    public class DashboardMetricsDto
    {
        // ── KPI Cards ──────────────────────────────────────────────────
        public decimal TotalRevenue { get; set; }
        public decimal OutstandingBalance { get; set; }
        public int PendingInvoicesCount { get; set; }
        public int ActiveWorkOrders { get; set; }
        public int CompletedWorkOrdersThisMonth { get; set; }
        public decimal TotalBaseSalariesThisMonth { get; set; }
        public decimal TotalBonusesThisMonth { get; set; }
        public decimal TotalPenaltiesThisMonth { get; set; }
        public decimal NetLaborCostThisMonth { get; set; }

        // ── New KPIs ───────────────────────────────────────────────────
        public int TotalCustomers { get; set; }
        public int TotalQuotations { get; set; }
        public decimal TotalQuotationValue { get; set; }
        public int PendingQuotations { get; set; }
        public int TotalActiveContracts { get; set; }
        public int LowStockItems { get; set; }

        // ── Chart Series ───────────────────────────────────────────────
        public List<ChartDataPoint> RevenueOverTime { get; set; } = new();
        public List<ChartDataPoint> WorkOrdersByStatus { get; set; } = new();
        public List<ChartDataPoint> QuotationsByStatus { get; set; } = new();
        public List<ChartDataPoint> TopCustomersByRevenue { get; set; } = new();
        public List<ChartDataPoint> JobsCompletedOverTime { get; set; } = new();
        public List<ChartDataPoint> InvoiceStatusBreakdown { get; set; } = new();
    }
}
