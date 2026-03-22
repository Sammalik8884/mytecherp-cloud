using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.System;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class TimeTrackingService : ITimeTrackingService
    {
        private readonly ApplicationDbContext _context;

        public TimeTrackingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> CheckInAsync(CheckInDto dto, string technicianId)
        {
            var activeLog = await _context.TimeLogs
                .FirstOrDefaultAsync(t => t.WorkOrderId == dto.WorkOrderId && t.TechnicianId == technicianId && t.CheckOutTime == null);

            if (activeLog != null) throw new Exception("Technician is already checked in!");

            var log = new TimeLog
            {
                WorkOrderId = dto.WorkOrderId,
                TechnicianId = technicianId,
                CheckInTime = DateTime.UtcNow,
                CheckInLatitude = dto.Latitude,
                CheckInLongitude = dto.Longitude
            };

            var workOrder = await _context.WorkOrders.FindAsync(dto.WorkOrderId);
            if (workOrder != null)
            {
                if (workOrder.Status != MytechERP.domain.Enums.WorkOrderStatus.Initialized && workOrder.Status != MytechERP.domain.Enums.WorkOrderStatus.InProgress)
                {
                    throw new InvalidOperationException($"Cannot Check-In: Work Order must be Initialized. Current status is {workOrder.Status}.");
                }
                workOrder.Status = MytechERP.domain.Enums.WorkOrderStatus.InProgress;
            }

            _context.TimeLogs.Add(log);
            await _context.SaveChangesAsync();
            return log.Id;
        }

        public async Task<bool> CheckOutAsync(CheckOutDto dto, string technicianId)
        {
            var activeLog = await _context.TimeLogs
                .FirstOrDefaultAsync(t => t.WorkOrderId == dto.WorkOrderId && t.TechnicianId == technicianId && t.CheckOutTime == null);

            if (activeLog == null) throw new Exception("No active check-in found.");

            activeLog.CheckOutTime = DateTime.UtcNow;
            activeLog.CheckOutLatitude = dto.Latitude;
            activeLog.CheckOutLongitude = dto.Longitude;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<decimal> CalculateJobLaborCostAsync(int workOrderId, decimal defaultHourlyRate)
        {
            var logs = await _context.TimeLogs.Where(t => t.WorkOrderId == workOrderId).ToListAsync();
            decimal totalCost = 0;

            foreach (var log in logs)
            {
                if (log.CheckOutTime == null) log.CheckOutTime = DateTime.UtcNow; 

                double hours = log.GetTotalHours();
                double roundedHours = Math.Ceiling(hours * 4) / 4.0;

                log.HourlyRate = defaultHourlyRate;
                log.TotalCost = (decimal)roundedHours * defaultHourlyRate;
                totalCost += log.TotalCost;
            }

            await _context.SaveChangesAsync();
            return totalCost;
        }
    }
}
    
