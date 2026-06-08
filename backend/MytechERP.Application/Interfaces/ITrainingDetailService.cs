using System.Collections.Generic;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;

namespace MytechERP.Application.Interfaces
{
    public interface ITrainingDetailService
    {
        Task<IEnumerable<TrainingDetailDto>> GetAllAsync();
        Task<TrainingDetailDto?> GetByIdAsync(int id);
        Task<TrainingDetailDto> CreateAsync(TrainingDetailDto trainingDetailDto);
        Task<bool> UpdateAsync(int id, TrainingDetailDto trainingDetailDto);
        Task<bool> DeleteAsync(int id);
        Task<bool> UpdateParticipantAsync(int participantId, string name, string status);
        Task<bool> DeleteParticipantAsync(int participantId);
    }
}
