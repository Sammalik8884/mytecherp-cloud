using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface ISyncNotifier
    {
        Task NotifySyncCompletedAsync(string entityType, List<int> affectedServerIds);
    }
}
