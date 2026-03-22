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
    }
}
