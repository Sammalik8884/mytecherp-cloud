namespace MytechERP.Application.DTOs.Dashboard
{
    public class SalesmanActivityRecordDto
    {
        public string SalesmanUserId { get; set; } = string.Empty;
        public string SalesmanName { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty; // e.g. "yyyy-MM-dd"
        public int TotalVisits { get; set; }
        public decimal ActivityPercentage { get; set; } // Based on 5 visits = 100%
    }

    public class SalesmanActivitySummaryDto
    {
        public string SalesmanUserId { get; set; } = string.Empty;
        public string SalesmanName { get; set; } = string.Empty;
        public int TotalVisitsInPeriod { get; set; }
        public int AverageVisitsPerDay { get; set; }
        public decimal AverageActivityPercentage { get; set; }
        public List<SalesmanActivityRecordDto> DailyRecords { get; set; } = new();
    }

    public class SalesmanActivityResponseDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int BenchmarkVisitsPerDay { get; set; } = 5;
        
        // This is primarily for the Frontend Charts
        public List<ChartDataPoint> OverallActivityTrend { get; set; } = new();
        
        // Breakdowns per salesman for tabular/report views
        public List<SalesmanActivitySummaryDto> SalesmenSummary { get; set; } = new();
    }
}
