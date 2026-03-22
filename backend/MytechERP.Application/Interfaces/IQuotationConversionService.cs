using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IQuotationConversionService
    {
        Task<int> ConvertToWorkOrderAsync(int quotationId);
        Task<int> ConvertToContractAsync(int quotationId, DateTime startDate, int monthsDuration);
    }
}
