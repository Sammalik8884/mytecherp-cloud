using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.System;
using MytechERP.Infrastructure.Persistance;
using Polly;
using Polly.Retry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.BackgroundJobs
{
    public class QueuedHostedService : BackgroundService
    {
        private readonly IBackgroundTaskQueue _taskQueue;
        private readonly IServiceProvider _serviceProvider; 
        private readonly ILogger<QueuedHostedService> _logger;
        private readonly AsyncRetryPolicy _retryPolicy;

        public QueuedHostedService(
            IBackgroundTaskQueue taskQueue,
            IServiceProvider serviceProvider,
            ILogger<QueuedHostedService> logger)
        {
            _taskQueue = taskQueue;
            _serviceProvider = serviceProvider;
            _logger = logger;

            
            _retryPolicy = Policy
                .Handle<Exception>()
                .WaitAndRetryAsync(3,
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    (exception, timeSpan, retryCount, context) =>
                    {
                        _logger.LogWarning($"⚠️ Background Job failed. Retrying in {timeSpan.TotalSeconds}s. Attempt {retryCount}. Error: {exception.Message}");
                    });
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Global Background Job Processor Started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var (workItem, jobName) = await _taskQueue.DequeueAsync(stoppingToken);

                try
                {
                    await _retryPolicy.ExecuteAsync(async () =>
                    {
                        using var scope = _serviceProvider.CreateScope();

                        await workItem(scope.ServiceProvider, stoppingToken);
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"❌ Job '{jobName}' failed permanently.");
                    await LogFailureToDb(jobName, ex);
                }
            }
        }

        private async Task LogFailureToDb(string jobName, Exception ex)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var failure = new SystemFailure
            {
                JobName = jobName,
                ErrorMessage = ex.Message,
                StackTrace = ex.StackTrace ?? "No Stack Trace",
                RetryCount = 3,
                FailedAt = DateTime.UtcNow
            };

            db.SystemFailures.Add(failure); 
            await db.SaveChangesAsync();
        }
    
    }
}
