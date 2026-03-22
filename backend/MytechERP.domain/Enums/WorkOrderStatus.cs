using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Enums
{
    public enum WorkOrderStatus
    {
        Created = 0,
        Assigned = 1,
        Initialized = 2,
        InProgress = 3,
        Completed = 4,
        PendingApproval = 5,
        Approved = 6,
        Rejected = 7,
        Cancelled = 8
    }
}
