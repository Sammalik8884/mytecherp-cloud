using Microsoft.AspNetCore.SignalR;
using MytechERP.API.Hubs;
using MytechERP.Application.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.API.Services
{
    public class SignalRSyncNotifier : ISyncNotifier
    {
        private readonly IHubContext<SyncHub> _hubContext;

        public SignalRSyncNotifier(IHubContext<SyncHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task NotifySyncCompletedAsync(string entityType, List<int> affectedServerIds)
        {
            await _hubContext.Clients.All.SendAsync("SyncCompleted", entityType, affectedServerIds);
        }
    }
}
