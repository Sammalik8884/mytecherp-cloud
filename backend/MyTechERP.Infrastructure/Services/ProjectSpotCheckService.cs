using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services
{
    public class ProjectSpotCheckService : IProjectSpotCheckService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public ProjectSpotCheckService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<ProjectSpotCheckDto?> GetByIdAsync(int id)
        {
            var entity = await _context.ProjectSpotChecks
                .Include(x => x.Site)
                .Include(x => x.CreatedByUser)
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null) return null;

            return MapToDto(entity);
        }

        public async Task<IEnumerable<ProjectSpotCheckDto>> GetAllAsync()
        {
            var entities = await _context.ProjectSpotChecks
                .Include(x => x.Site)
                .Include(x => x.CreatedByUser)
                .Include(x => x.Items)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToDto);
        }

        public async Task<ProjectSpotCheckDto> CreateAsync(CreateProjectSpotCheckDto dto)
        {
            var userId = _currentUserService.UserId ?? string.Empty;
            var tenantId = _currentUserService.TenantId.GetValueOrDefault();

            var entity = new ProjectSpotCheck
            {
                SiteId = dto.SiteId,
                TenantId = tenantId,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UploadedFiles = dto.UploadedFiles,
                Items = dto.Items.Select(i => new ProjectSpotCheckItem
                {
                    ItemText = i.ItemText,
                    IsYes = i.IsYes,
                    IsNo = i.IsNo,
                    IsNA = i.IsNA,
                    Comments = i.Comments,
                    UpdatedAt = DateTime.UtcNow
                }).ToList()
            };

            _context.ProjectSpotChecks.Add(entity);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(entity.Id) ?? MapToDto(entity);
        }

        public async Task<ProjectSpotCheckDto> UpdateAsync(int id, CreateProjectSpotCheckDto dto)
        {
            var entity = await _context.ProjectSpotChecks
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
            {
                throw new KeyNotFoundException("Project Spot Check not found");
            }

            entity.SiteId = dto.SiteId;
            entity.UploadedFiles = dto.UploadedFiles;
            entity.UpdatedAt = DateTime.UtcNow;

            _context.ProjectSpotCheckItems.RemoveRange(entity.Items);

            entity.Items = dto.Items.Select(i => new ProjectSpotCheckItem
            {
                ItemText = i.ItemText,
                IsYes = i.IsYes,
                IsNo = i.IsNo,
                IsNA = i.IsNA,
                Comments = i.Comments,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            await _context.SaveChangesAsync();

            return await GetByIdAsync(entity.Id) ?? MapToDto(entity);
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.ProjectSpotChecks.FindAsync(id);
            if (entity != null)
            {
                entity.IsDeleted = true;
                entity.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        private ProjectSpotCheckDto MapToDto(ProjectSpotCheck entity)
        {
            return new ProjectSpotCheckDto
            {
                Id = entity.Id,
                SiteId = entity.SiteId,
                SiteName = entity.Site?.Name,
                CreatedAt = entity.CreatedAt,
                CreatedByUserName = entity.CreatedByUser?.UserName ?? string.Empty,
                UploadedFiles = entity.UploadedFiles,
                Items = entity.Items.Select(i => new ProjectSpotCheckItemDto
                {
                    Id = i.Id,
                    ItemText = i.ItemText,
                    IsYes = i.IsYes,
                    IsNo = i.IsNo,
                    IsNA = i.IsNA,
                    Comments = i.Comments
                }).ToList()
            };
        }
    }
}
