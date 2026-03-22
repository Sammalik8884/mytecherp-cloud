using MytechERP.domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Repositories
{
    public interface IChecklistRepository
    {
        public Task<ChecklistQuestion> AddQuestionAsync(ChecklistQuestion question);
        public Task<List<ChecklistQuestion>> GetByCategoryIdAsync(int categoryId);
    }
}
