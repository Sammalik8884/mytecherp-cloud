using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MytechERP.Application.Interfaces;
using MytechERP.Infrastructure.Persistance;

namespace MytechERP.API.BackgroundServices
{
    public class SalesmanVisitMonitorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SalesmanVisitMonitorService> _logger;

        public SalesmanVisitMonitorService(IServiceProvider serviceProvider, ILogger<SalesmanVisitMonitorService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SalesmanVisitMonitorService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckSalesmanVisitsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing CheckSalesmanVisitsAsync.");
                }

                // Wait 24 hours before next run
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task CheckSalesmanVisitsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var twoWeeksAgo = DateTime.UtcNow.AddDays(-14);

            // Get salesmen and their site visits in last 14 days
            var salesmenVisits = await context.SiteVisits
                .Include(v => v.SalesLead)
                .ThenInclude(l => l.SalesmanUser)
                .Where(v => v.StartTime >= twoWeeksAgo && v.SalesLead != null && v.SalesLead.SalesmanUser != null)
                .GroupBy(v => new { v.SalesLead!.SalesmanUserId, v.SalesLead.SalesmanUser!.FullName, v.SalesLead.SalesmanUser.Email })
                .ToListAsync();

            var adminAndManagers = await context.Users
                .Join(context.UserRoles, u => u.Id, ur => ur.UserId, (u, ur) => new { u, ur })
                .Join(context.Roles, x => x.ur.RoleId, r => r.Id, (x, r) => new { x.u, r.Name })
                .Where(x => x.Name == "Admin" || x.Name == "Manager")
                .Select(x => x.u.Email)
                .Distinct()
                .ToListAsync();

            if (!adminAndManagers.Any()) return;

            foreach (var salesmanGrp in salesmenVisits)
            {
                var distinctSites = salesmanGrp.Select(v => v.SalesLeadId).Distinct().ToList();

                if (distinctSites.Count == 1)
                {
                    var siteId = distinctSites.First();
                    var siteInfo = await context.SalesLeads
                        .Where(s => s.Id == siteId)
                        .Select(s => s.LeadNumber)
                        .FirstOrDefaultAsync();

                    // Count how many active leads this salesman actually has
                    var activeLeadsCount = await context.SalesLeads
                        .Where(l => l.SalesmanUserId == salesmanGrp.Key.SalesmanUserId && l.Status != MytechERP.domain.Enums.LeadStatus.Closed)
                        .CountAsync();

                    // If they have more than 1 active lead but only visited 1, alert
                    if (activeLeadsCount > 1)
                    {
                        string subject = $"Warning: Salesman {salesmanGrp.Key.FullName} ignored other sites";
                        string body = $@"
<p>Dear Admin/Manager,</p>
<p>The salesman <strong>{salesmanGrp.Key.FullName}</strong> ({salesmanGrp.Key.Email}) has only visited a single site (Lead: <strong>{siteInfo}</strong>) in the past 2 weeks.</p>
<p>They have {activeLeadsCount} active leads but have ignored the others.</p>
<p>Please review their activity on the dashboard.</p>
";
                        foreach (var email in adminAndManagers)
                        {
                            if (!string.IsNullOrEmpty(email))
                            {
                                await emailService.SendEmailAsync(email, subject, body);
                            }
                        }
                    }
                }
            }
        }
    }
}
