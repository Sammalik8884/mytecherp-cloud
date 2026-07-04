using MytechERP.Application.DTOs.Dashboard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardMetricsDto> GetExecutiveMetricsAsync(DateTime? startDate = null, DateTime? endDate = null);
        Task<SalesmanActivityResponseDto> GetSalesmanActivityMetricsAsync(DateTime? startDate = null, DateTime? endDate = null, string? region = null, string? salesmanId = null);
        Task<EstimatorDashboardMetricsDto> GetEstimatorMetricsAsync(string userId, DateTime? startDate = null, DateTime? endDate = null);
    }
}
