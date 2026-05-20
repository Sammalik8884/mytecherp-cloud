using MytechERP.domain.Entities.System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface ITermsAndConditionsService
    {
        Task<List<TermsAndConditionsTemplate>> GetAllAsync();
        Task<TermsAndConditionsTemplate> GetByIdAsync(int id);
        Task<TermsAndConditionsTemplate> GetDefaultAsync();
        Task<TermsAndConditionsTemplate> CreateAsync(TermsAndConditionsTemplate template);
        Task<TermsAndConditionsTemplate> UpdateAsync(int id, TermsAndConditionsTemplate template);
        Task<bool> DeleteAsync(int id);
        Task<bool> SetDefaultAsync(int id);
    }
}
