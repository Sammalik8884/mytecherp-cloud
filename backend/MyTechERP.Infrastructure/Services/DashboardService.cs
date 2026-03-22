using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Dashboard;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Enums;
using MytechERP.Infrastructure.Persistance;
using MytechERP.domain.Entities.Finance; // InvoiceStatus lives here

namespace MyTechERP.Infrastructure.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly ApplicationDbContext _context;

        public DashboardService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardMetricsDto> GetExecutiveMetricsAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            var endOfPeriod = endDate ?? DateTime.UtcNow;
            var startOfPeriod = startDate ?? endOfPeriod.AddMonths(-6);

            // Determine grouping granularity (Day vs Month)
            bool groupDaily = (endOfPeriod - startOfPeriod).TotalDays <= 31;

            // ── Sequential KPI queries (Filtered by Time Period where applicable) ──
            var totalRevenue = await _context.Invoices
                .Where(i => i.Status == InvoiceStatus.Paid && i.UpdatedAt >= startOfPeriod && i.UpdatedAt <= endOfPeriod)
                .SumAsync(i => i.AmountPaid);

            var outstandingBalance = await _context.Invoices
                .Where(i => (i.Status == InvoiceStatus.Issued || i.Status == InvoiceStatus.Overdue))
                .SumAsync(i => i.TotalAmount - i.AmountPaid);

            var pendingInvoicesCount = await _context.Invoices
                .CountAsync(i => i.Status == InvoiceStatus.Issued);

            var activeWorkOrders = await _context.WorkOrders
                .CountAsync(w => w.Status == WorkOrderStatus.Created || w.Status == WorkOrderStatus.Assigned 
                              || w.Status == WorkOrderStatus.Initialized || w.Status == WorkOrderStatus.InProgress);

            var completedWorkOrdersThisMonth = await _context.WorkOrders
                .CountAsync(w => w.Status == WorkOrderStatus.Completed && w.CompletedDate >= startOfPeriod && w.CompletedDate <= endOfPeriod);

            var payrollSummary = await _context.Payslips
                .Where(p => p.PeriodStart >= startOfPeriod && p.PeriodEnd <= endOfPeriod)
                .GroupBy(x => 1)
                .Select(g => new
                {
                    TotalBase = g.Sum(p => p.BaseSalaryAmount),
                    TotalBonuses = g.Sum(p => p.TotalBonuses),
                    TotalPenalties = g.Sum(p => p.TotalPenalties),
                    NetPay = g.Sum(p => p.NetPay)
                })
                .FirstOrDefaultAsync();

            var totalCustomers = await _context.Customers.CountAsync();
            var totalQuotations = await _context.Quotations.CountAsync();
            var totalQuotationValue = await _context.Quotations.SumAsync(q => q.GrandTotal);
            var pendingQuotations = await _context.Quotations.CountAsync(q => q.Status == QuotationStatus.Draft || q.Status == QuotationStatus.PendingApproval);
            var activeContracts = await _context.Contracts.CountAsync(c => c.EndDate > endOfPeriod);
            var lowStockItems = await _context.InventoryStocks.CountAsync(i => i.QuantityOnHand <= 5);

            // ── Chart data ──────────────────────────────────────────
            var revenueQuery = _context.Invoices
                .Where(i => i.Status == InvoiceStatus.Paid && i.IssueDate >= startOfPeriod && i.IssueDate <= endOfPeriod);

            var revenueChartRaw = await (groupDaily 
                ? revenueQuery.GroupBy(i => new { i.IssueDate.Year, i.IssueDate.Month, i.IssueDate.Day })
                              .Select(g => new { g.Key.Year, g.Key.Month, Day = g.Key.Day, Total = g.Sum(i => i.AmountPaid) })
                              .OrderBy(x => x.Year).ThenBy(x => x.Month).ThenBy(x => x.Day).ToListAsync()
                : revenueQuery.GroupBy(i => new { i.IssueDate.Year, i.IssueDate.Month })
                              .Select(g => new { g.Key.Year, g.Key.Month, Day = 1, Total = g.Sum(i => i.AmountPaid) })
                              .OrderBy(x => x.Year).ThenBy(x => x.Month).ToListAsync());

            var woByStatusRaw = await _context.WorkOrders
                .Where(w => w.CreatedAt >= startOfPeriod && w.CreatedAt <= endOfPeriod)
                .GroupBy(w => w.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var quoteByStatusRaw = await _context.Quotations
                .Where(q => q.CreatedAt >= startOfPeriod && q.CreatedAt <= endOfPeriod)
                .GroupBy(q => q.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var topRaw = await _context.Invoices
                .Where(i => i.Status == InvoiceStatus.Paid && i.IssueDate >= startOfPeriod && i.IssueDate <= endOfPeriod)
                .GroupBy(i => i.CustomerId)
                .Select(g => new { CustomerId = g.Key, Total = g.Sum(i => i.AmountPaid) })
                .OrderByDescending(x => x.Total)
                .Take(5)
                .ToListAsync();

            var jobsQuery = _context.WorkOrders
                .Where(w => w.Status == WorkOrderStatus.Completed && w.CompletedDate != null && w.CompletedDate >= startOfPeriod && w.CompletedDate <= endOfPeriod);

            var jobsRaw = await (groupDaily
                ? jobsQuery.GroupBy(w => new { w.CompletedDate.Value.Year, w.CompletedDate.Value.Month, w.CompletedDate.Value.Day })
                           .Select(g => new { g.Key.Year, g.Key.Month, Day = g.Key.Day, Count = g.Count() })
                           .OrderBy(x => x.Year).ThenBy(x => x.Month).ThenBy(x => x.Day).ToListAsync()
                : jobsQuery.GroupBy(w => new { w.CompletedDate.Value.Year, w.CompletedDate.Value.Month })
                           .Select(g => new { g.Key.Year, g.Key.Month, Day = 1, Count = g.Count() })
                           .OrderBy(x => x.Year).ThenBy(x => x.Month).ToListAsync());

            var invoiceStatusRaw = await _context.Invoices
                .Where(i => i.IssueDate >= startOfPeriod && i.IssueDate <= endOfPeriod)
                .GroupBy(i => i.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            // Build dynamic labels for time-series charts based on granularity
            var dateLabels = new List<DateTime>();
            if (groupDaily)
            {
                for (var d = startOfPeriod.Date; d <= endOfPeriod.Date; d = d.AddDays(1))
                    dateLabels.Add(d);
            }
            else
            {
                var currentMonth = new DateTime(startOfPeriod.Year, startOfPeriod.Month, 1);
                while (currentMonth <= new DateTime(endOfPeriod.Year, endOfPeriod.Month, 1))
                {
                    dateLabels.Add(currentMonth);
                    currentMonth = currentMonth.AddMonths(1);
                }
            }

            var revenueChart = dateLabels.Select(d =>
            {
                var match = revenueChartRaw.FirstOrDefault(r => r.Year == d.Year && r.Month == d.Month && (!groupDaily || r.Day == d.Day));
                return new ChartDataPoint { Name = groupDaily ? d.ToString("MMM dd") : d.ToString("MMM yyyy"), Value = match?.Total ?? 0 };
            }).ToList();

            var jobsChart = dateLabels.Select(d =>
            {
                var match = jobsRaw.FirstOrDefault(r => r.Year == d.Year && r.Month == d.Month && (!groupDaily || r.Day == d.Day));
                return new ChartDataPoint { Name = groupDaily ? d.ToString("MMM dd") : d.ToString("MMM yyyy"), Value = match?.Count ?? 0 };
            }).ToList();

            // Resolve customer names
            var customerIds = topRaw.Select(t => t.CustomerId).ToList();
            var customerNames = await _context.Customers
                .Where(c => customerIds.Contains(c.Id))
                .Select(c => new { c.Id, Name = c.CompanyName ?? c.Name })
                .ToListAsync();

            var topCustomersChart = topRaw.Select(t =>
            {
                var name = customerNames.FirstOrDefault(c => c.Id == t.CustomerId)?.Name ?? $"Customer {t.CustomerId}";
                return new ChartDataPoint { Name = name, Value = t.Total };
            }).ToList();

            return new DashboardMetricsDto
            {
                TotalRevenue                 = totalRevenue,
                OutstandingBalance           = outstandingBalance,
                PendingInvoicesCount         = pendingInvoicesCount,
                ActiveWorkOrders             = activeWorkOrders,
                CompletedWorkOrdersThisMonth = completedWorkOrdersThisMonth,
                TotalBaseSalariesThisMonth   = payrollSummary?.TotalBase ?? 0,
                TotalBonusesThisMonth        = payrollSummary?.TotalBonuses ?? 0,
                TotalPenaltiesThisMonth      = payrollSummary?.TotalPenalties ?? 0,
                NetLaborCostThisMonth        = payrollSummary?.NetPay ?? 0,
                TotalCustomers               = totalCustomers,
                TotalQuotations              = totalQuotations,
                TotalQuotationValue          = totalQuotationValue,
                PendingQuotations            = pendingQuotations,
                TotalActiveContracts         = activeContracts,
                LowStockItems                = lowStockItems,

                RevenueOverTime        = revenueChart,
                WorkOrdersByStatus     = woByStatusRaw.Select(x => new ChartDataPoint { Name = x.Status, Value = x.Count }).ToList(),
                QuotationsByStatus     = quoteByStatusRaw.Select(x => new ChartDataPoint { Name = x.Status, Value = x.Count }).ToList(),
                TopCustomersByRevenue  = topCustomersChart,
                JobsCompletedOverTime  = jobsChart,
                InvoiceStatusBreakdown = invoiceStatusRaw.Select(x => new ChartDataPoint { Name = x.Status, Value = x.Count }).ToList(),
            };
        }
    }
}
