using MytechERP.Application.DTOs;
using MytechERP.domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface ICheckListService
    {
        public Task<ChecklistQuestion> CreateQuestionAsync(ChecklistQuestionRequestDto request);
        public Task<List<ChecklistQuestionResponseDto>> GetTemplateByCategoryAsync(int categoryId);
    }
}
