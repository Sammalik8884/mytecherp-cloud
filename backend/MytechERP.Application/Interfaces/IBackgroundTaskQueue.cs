using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public  interface IBackgroundTaskQueue
    {
        ValueTask QueueBackgroundWorkItemAsync(Func<IServiceProvider, CancellationToken, ValueTask> workItem, string jobName);

        ValueTask<(Func<IServiceProvider, CancellationToken, ValueTask> WorkItem, string JobName)> DequeueAsync(CancellationToken cancellationToken);
    }
}
