using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IWorkOrderGenerator
    {
        Task GenerateMonthlyJobs();
    }
}
