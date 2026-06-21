using MytechERP.Application.DTOs.Procurement;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IProcurementService
    {
        Task<List<ProcurementRequestDto>> GetAllProcurementsAsync(string userId, string role);
        Task<List<ProcurementRequestDto>> GetPendingPdApprovalsAsync();
        Task<List<ProcurementRequestDto>> GetApprovedRequestsAsync();
        Task<List<ProcurementRequestDto>> GetPendingProcurementsForExecutiveAsync(string executiveEmail);
        Task<List<ProcurementRequestDto>> GetCompletedProcurementsForExecutiveAsync(string executiveEmail);
        
        Task<ProcurementRequestDto> GetByIdAsync(int id);
        
        Task<ProcurementRequestDto> CreateRequestAsync(CreateProcurementRequestDto dto, string supervisorName, string supervisorEmail);
        Task<ProcurementRequestDto> ReviewByPdAsync(int id, PdReviewProcurementDto dto, string pdEmail);
        
        Task<ProcurementRequestDto> GenerateArfAsync(int procurementId, string procurementHeadEmail, string arfDetailsUrl);
        Task<ProcurementRequestDto> AssignExecutiveAsync(int id, AssignProcurementExecutiveDto dto);
        
        Task<ProcurementRequestDto> CompleteProcurementAsync(int id, CompleteProcurementDto dto);
    }
}
