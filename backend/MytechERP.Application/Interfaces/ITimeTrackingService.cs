using MytechERP.Application.DTOs.CRM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface ITimeTrackingService
    {
        Task<int> CheckInAsync(CheckInDto dto, string technicianId);
        Task<bool> CheckOutAsync(CheckOutDto dto, string technicianId);
        Task<decimal> CalculateJobLaborCostAsync(int workOrderId, decimal defaultHourlyRate);
    }
}
