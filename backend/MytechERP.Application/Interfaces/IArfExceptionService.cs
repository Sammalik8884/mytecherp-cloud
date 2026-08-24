using MytechERP.Application.DTOs.Finance;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IArfExceptionService
    {
        Task<ArfExceptionRequestDto> CreateAsync(CreateArfExceptionRequestDto dto);
        Task<ArfExceptionRequestDto> ApproveAsync(int id, ApproveArfExceptionRequestDto dto);
        Task<IEnumerable<ArfExceptionRequestDto>> GetAllAsync();
        Task<IEnumerable<ArfExceptionRequestDto>> GetMyRequestsAsync();
    }
}
