using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Dashboard
{
    public class EstimatorActivityResponseDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<EstimatorActivitySummaryDto> EstimatorsSummary { get; set; } = new List<EstimatorActivitySummaryDto>();
    }

    public class EstimatorActivitySummaryDto
    {
        public string EstimatorId { get; set; } = string.Empty;
        public string EstimatorName { get; set; } = string.Empty;
        
        public int AssignedQuotesCount { get; set; }
        public int MadeQuotesCount { get; set; }
        public int PendingQuotesCount { get; set; }
        public int ApprovedQuotesCount { get; set; }

        public int TotalLineItems { get; set; }
        public int LocalSupplyLines { get; set; }
        public int ImportedSupplyLines { get; set; }
        public int LocalInstallLines { get; set; }
        public int ImportedInstallLines { get; set; }

        public List<QuoteActivityDetailDto> QuoteActivityDetails { get; set; } = new List<QuoteActivityDetailDto>();
    }

    public class QuoteActivityDetailDto
    {
        public int QuoteId { get; set; }
        public string QuoteNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        
        public int TotalLineItems { get; set; }
        public int LocalSupplyLines { get; set; }
        public int ImportedSupplyLines { get; set; }
        public int LocalInstallLines { get; set; }
        public int ImportedInstallLines { get; set; }
    }
}
