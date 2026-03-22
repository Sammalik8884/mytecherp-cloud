using MytechERP.Application.DTOs.CRM;
using MytechERP.domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IWorkOrderService
    {
        Task<List<ChecklistResultDto>> GetChecklistAsync(int workOrderId);
        Task<bool> SubmitChecklistAsync(int workOrderId, List<UpdateChecklistDto> answers);
        Task<WorkOrderDto> InitializeInspectionAsync(int workOrderId);
        Task<WorkOrderDto> CreateWorkOrderAsync(CreateWorkOrderDto request);
        Task<WorkOrderDto?> GetWorkOrderByIdAsync(int id);
        Task<List<WorkOrderDto>> GetAllWorkOrdersAsync(MytechERP.Application.Filters.PaginationFilter filter);
        Task<bool> UpdateWorkOrderAsync(int id, UpdateWorkOrderDto request);
        Task<bool> DeleteWorkOrderAsync(int id);
        Task<List<WorkOrderDto>> GetMyJobsAsync(string technicianId);
        Task<bool> CompleteJobAsync(int id, string notes, InspectionResult result);
        Task<bool> ApproveJobAsync(int id, bool isApproved);
        Task<int> CreateWorkOrderFromQuoteAsync(CreateRepairJobDto dto);
        Task<object> AddEvidenceAsync(int workOrderId, System.IO.Stream fileStream, string fileName, string contentType, double? latitude, double? longitude);
        Task<bool> AssignTechnicianAsync(int workOrderId, AssignTechnicianDto dto);
    }
}
