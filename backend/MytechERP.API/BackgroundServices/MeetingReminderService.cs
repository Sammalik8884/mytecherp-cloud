using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MytechERP.Application.Interfaces;
using MytechERP.Infrastructure.Persistance;

namespace MytechERP.API.BackgroundServices
{
    public class MeetingReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MeetingReminderService> _logger;

        public MeetingReminderService(IServiceProvider serviceProvider, ILogger<MeetingReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("MeetingReminderService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckUpcomingMeetingsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing CheckUpcomingMeetingsAsync.");
                }

                // Poll every hour
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        private async Task CheckUpcomingMeetingsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var syncNotifier = scope.ServiceProvider.GetRequiredService<ISyncNotifier>();

            var now = DateTime.UtcNow;
            var tomorrowStart = now.Date.AddDays(1);
            var tomorrowEnd = tomorrowStart.AddDays(1).AddTicks(-1);

            // Find meetings happening tomorrow that haven't been notified yet
            var meetingsToNotify = await context.SalesMeetingReminders
                .Include(m => m.SalesmanUser)
                .Where(m => m.IsNotified == false && m.MeetingDate >= tomorrowStart && m.MeetingDate <= tomorrowEnd)
                .ToListAsync();

            if (!meetingsToNotify.Any()) return;

            foreach (var meeting in meetingsToNotify)
            {
                if (meeting.SalesmanUser == null || string.IsNullOrEmpty(meeting.SalesmanUser.Email))
                    continue;

                // 1. Send Email
                string subject = $"Meeting Reminder: {meeting.SiteName} Tomorrow";
                string timeStr = meeting.IsTimeIncluded ? meeting.MeetingDate.ToString("hh:mm tt") : "Any time";
                string body = $@"
<p>Dear {meeting.SalesmanUser.FullName},</p>
<p>This is a reminder that you have a meeting scheduled tomorrow.</p>
<ul>
    <li><strong>Site Name:</strong> {meeting.SiteName}</li>
    <li><strong>Date:</strong> {meeting.MeetingDate.ToString("MMMM dd, yyyy")}</li>
    <li><strong>Time:</strong> {timeStr}</li>
</ul>
<p>Please log in to the MyTechERP portal to manage your schedule.</p>
";
                try
                {
                    await emailService.SendEmailAsync(meeting.SalesmanUser.Email, subject, body);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to send reminder email to {meeting.SalesmanUser.Email}");
                }

                // 2. Create In-App Notification
                try
                {
                    await notificationService.CreateNotificationAsync(
                        userId: meeting.SalesmanUserId,
                        title: "Upcoming Meeting Reminder",
                        message: $"You have a meeting at {meeting.SiteName} tomorrow.",
                        type: "meeting_reminder"
                    );
                    
                    // Signal frontend via SignalR that a new notification arrived
                    await syncNotifier.NotifySyncCompletedAsync("MeetingReminder", new List<int> { meeting.Id });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to create notification for user {meeting.SalesmanUserId}");
                }

                // 3. Mark as notified so it triggers the frontend popup alert polling, but doesn't get emailed again
                meeting.IsNotified = true;
            }

            await context.SaveChangesAsync();
        }
    }
}
