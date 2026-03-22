using MytechERP.domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IWorkflowService
    {
        bool CanTransition(WorkOrderStatus current, WorkOrderStatus target);
        void ValidateTransition(WorkOrderStatus current, WorkOrderStatus target);
    }
}
