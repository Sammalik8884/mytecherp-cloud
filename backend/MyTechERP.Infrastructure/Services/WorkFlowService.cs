using MytechERP.Application.Interfaces;
using MytechERP.domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class WorkFlowService : IWorkflowService
    {
        private readonly Dictionary<WorkOrderStatus, List<WorkOrderStatus>> _allowedTransitions = new()
        {
            { WorkOrderStatus.Created,         new() { WorkOrderStatus.Assigned, WorkOrderStatus.Cancelled } },
            { WorkOrderStatus.Assigned,        new() { WorkOrderStatus.Initialized, WorkOrderStatus.Cancelled } },
            { WorkOrderStatus.Initialized,     new() { WorkOrderStatus.InProgress, WorkOrderStatus.Cancelled } },
            { WorkOrderStatus.InProgress,      new() { WorkOrderStatus.PendingApproval, WorkOrderStatus.Cancelled } },
            { WorkOrderStatus.PendingApproval, new() { WorkOrderStatus.Approved, WorkOrderStatus.Rejected } },
            { WorkOrderStatus.Approved,        new() { WorkOrderStatus.Completed } },
            { WorkOrderStatus.Rejected,        new() { WorkOrderStatus.Assigned, WorkOrderStatus.InProgress } },
            { WorkOrderStatus.Cancelled,       new() { } },
            { WorkOrderStatus.Completed,       new() { } }
        };
        public bool CanTransition(WorkOrderStatus current, WorkOrderStatus target)
        {
            if (_allowedTransitions.ContainsKey(current))
            {
                return _allowedTransitions[current].Contains(target);
            }
            return false;
        }
        public void ValidateTransition(WorkOrderStatus current, WorkOrderStatus target)
        {
            if (!CanTransition(current, target))
            {
                throw new InvalidOperationException($"Illegal State Transition: Cannot move from '{current}' to '{target}'.");
            }
        }
    }

}
