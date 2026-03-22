using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IAuditService
    {
        Task LogAsync(string userId, string entityName, int entityId, string action, string details, string? oldVal = null, string? newVal = null);
    }
}
