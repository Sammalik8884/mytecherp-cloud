using MytechERP.Application.DTOs;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MyTechERP.Infrastructure.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class CheckListService : ICheckListService
    {
        private readonly IChecklistRepository _repo;
        private readonly ICurrentUserService _currentUserService;


        public CheckListService(IChecklistRepository repo,ICurrentUserService currentUserService)
        {
         _repo = repo;
            _currentUserService = currentUserService;
        
        
        }

        public async Task<ChecklistQuestion> CreateQuestionAsync(ChecklistQuestionRequestDto request)
        {
            var userTenantId = _currentUserService.TenantId;
            if (userTenantId == null) throw new UnauthorizedAccessException("No Tenant ID found.");
            var config = new
            {
                Type = request.Type,
                Options = request.Options,
                Standard = request.StandardRef,
                TenantId = userTenantId.Value
            };

            var entity = new ChecklistQuestion
            {
                Text = request.Text,
                CategoryId = request.CategoryId,
                ConfigJson = JsonSerializer.Serialize(config), 
                IsActive = true,
                Version = "1.0"
            };

            return await _repo.AddQuestionAsync(entity);
        }

        public async Task<List<ChecklistQuestionResponseDto>> GetTemplateByCategoryAsync(int categoryId)

        {
            var questions = await _repo.GetByCategoryIdAsync(categoryId);

            return questions.Select(q => new ChecklistQuestionResponseDto
            {
                Id = q.Id,
                Text = q.Text,
                CategoryName = q.Category?.Name ?? "Unknown", 
                ConfigJson = q.ConfigJson,
                Version = q.Version
            }).ToList();
        }
    }
}
