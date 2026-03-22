using Microsoft.EntityFrameworkCore;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Enums;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class WorkOrderGenerator : IWorkOrderGenerator
    {
        
            private readonly ApplicationDbContext _context;

            public WorkOrderGenerator(ApplicationDbContext context)
            {
                _context = context;
            }

            public async Task GenerateMonthlyJobs()
            {
              
                var activeContracts = await _context.Contracts
                    .IgnoreQueryFilters() 
                    .Where(c => c.StartDate <= DateTime.UtcNow && c.EndDate >= DateTime.UtcNow)
                    .ToListAsync();

                foreach (var contract in activeContracts)
                {
                  
                    var lastJob = await _context.WorkOrders
                        .IgnoreQueryFilters()
                        .Where(w => w.ContractId == contract.Id)
                        .OrderByDescending(w => w.ScheduledDate)
                        .FirstOrDefaultAsync();

                    DateTime nextDueDate;

                    if (lastJob == null)
                    {
               
                        nextDueDate = contract.StartDate;
                    }
                    else
                    {
                        
                        nextDueDate = lastJob.ScheduledDate.AddMonths(contract.VisitFrequencyMonths);
                    }

                    if (nextDueDate <= DateTime.UtcNow)
                    {
                        await CreateJobForContract(contract, nextDueDate);
                    }
                }
            }

            private async Task CreateJobForContract(Contract contract, DateTime date)
            {
                var today = DateTime.UtcNow;
                var prefix = $"JOB-{today:yyMM}";
                
                var lastJob = await _context.WorkOrders
                    .IgnoreQueryFilters()
                    .Where(w => w.TenantId == contract.TenantId && w.JobNumber.StartsWith(prefix))
                    .OrderByDescending(w => w.JobNumber)
                    .FirstOrDefaultAsync();

                int sequence = 1;
                if (lastJob != null && lastJob.JobNumber.Length >= 13)
                {
                    if (int.TryParse(lastJob.JobNumber.Substring(9), out int lastSeq))
                    {
                        sequence = lastSeq + 1;
                    }
                }

                var jobNumber = $"{prefix}-{sequence:D4}";

                var newJob = new WorkOrder
                {
                    JobNumber = jobNumber,
                    ContractId = contract.Id,
                    TenantId = contract.TenantId,
                    ScheduledDate = date,
                    Status = WorkOrderStatus.Created,
                    Description = $"Auto-Generated Maintenance: {date:MMMM yyyy}",
                    TechnicianId = null 
                };

                _context.WorkOrders.Add(newJob);
                await _context.SaveChangesAsync();
            }
        }
    }

