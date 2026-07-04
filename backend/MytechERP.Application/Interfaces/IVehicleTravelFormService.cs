using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.HR;

namespace MytechERP.Application.Interfaces
{
    public interface IVehicleTravelFormService
    {
        Task<VehicleTravelFormDto> CreateAsync(CreateVehicleTravelFormDto dto, string userId);
        Task<List<VehicleTravelFormDto>> GetAllAsync(string userEmail, string userId);
        Task ApproveAsync(int id, string userEmail);
    }
}
