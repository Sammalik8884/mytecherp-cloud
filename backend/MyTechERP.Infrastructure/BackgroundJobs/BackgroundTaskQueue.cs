using MytechERP.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.BackgroundJobs
{
    public class BackgroundTaskQueue : IBackgroundTaskQueue
    {
        private readonly Channel<(Func<IServiceProvider, CancellationToken, ValueTask>, string)> _queue;

        public BackgroundTaskQueue()
        {
            var options = new BoundedChannelOptions(500)
            {
                FullMode = BoundedChannelFullMode.Wait
            };
            _queue = Channel.CreateBounded<(Func<IServiceProvider, CancellationToken, ValueTask>, string)>(options);
        }

        public async ValueTask QueueBackgroundWorkItemAsync(Func<IServiceProvider, CancellationToken, ValueTask> workItem, string jobName)
        {
            if (workItem == null) throw new ArgumentNullException(nameof(workItem));
            await _queue.Writer.WriteAsync((workItem, jobName));
        }

        public async ValueTask<(Func<IServiceProvider, CancellationToken, ValueTask> WorkItem, string JobName)> DequeueAsync(CancellationToken cancellationToken)
        {
            return await _queue.Reader.ReadAsync(cancellationToken);
        }

    }
}
