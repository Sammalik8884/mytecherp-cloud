using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services
{
    public class ProjectTechnicalHandoverService : IProjectTechnicalHandoverService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBlobService _blobService;

        public ProjectTechnicalHandoverService(ApplicationDbContext context, IBlobService blobService)
        {
            _context = context;
            _blobService = blobService;
        }

        public async Task<IEnumerable<ProjectTechnicalHandoverDto>> GetAllAsync()
        {
            var data = await _context.ProjectTechnicalHandovers
                .Include(x => x.Site)
                .Include(x => x.Customer)
                .Include(x => x.SecondaryCustomer)
                .Include(x => x.CreatedByUser)
                .Include(x => x.Attachments)
                .Where(x => !x.IsDeleted)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return data.Select(MapToDto);
        }

        public async Task<IEnumerable<ProjectTechnicalHandoverDto>> GetBySiteIdAsync(int siteId)
        {
            var data = await _context.ProjectTechnicalHandovers
                .Include(x => x.Site)
                .Include(x => x.Customer)
                .Include(x => x.SecondaryCustomer)
                .Include(x => x.CreatedByUser)
                .Include(x => x.Attachments)
                .Where(x => !x.IsDeleted && x.SiteId == siteId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return data.Select(MapToDto);
        }

        public async Task<ProjectTechnicalHandoverDto> GetByIdAsync(int id)
        {
            var data = await _context.ProjectTechnicalHandovers
                .Include(x => x.Site)
                .Include(x => x.Customer)
                .Include(x => x.SecondaryCustomer)
                .Include(x => x.CreatedByUser)
                .Include(x => x.Attachments)
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (data == null) throw new Exception("Not found");
            return MapToDto(data);
        }

        public async Task<ProjectTechnicalHandoverDto> CreateAsync(CreateProjectTechnicalHandoverDto dto, string userId)
        {
            var entity = new ProjectTechnicalHandover
            {
                SiteId = dto.SiteId,
                CustomerId = dto.CustomerId,
                SecondaryCustomerId = dto.SecondaryCustomerId,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            if (dto.Attachments != null && dto.Attachments.Any())
            {
                foreach (var file in dto.Attachments)
                {
                    if (file.Length > 0)
                    {
                        string fileExtension = Path.GetExtension(file.FileName);
                        string fileName = $"project-handover/{Guid.NewGuid()}{fileExtension}";
                        var url = await _blobService.UploadAsync(file, fileName);

                        entity.Attachments.Add(new ProjectTechnicalHandoverAttachment
                        {
                            FileName = file.FileName,
                            FileUrl = url
                        });
                    }
                }
            }

            _context.ProjectTechnicalHandovers.Add(entity);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(entity.Id);
        }

        public async Task<ProjectTechnicalHandoverDto> UpdateAsync(int id, CreateProjectTechnicalHandoverDto dto, string userId)
        {
            var entity = await _context.ProjectTechnicalHandovers
                .Include(x => x.Attachments)
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (entity == null) throw new Exception("Not found");

            entity.SiteId = dto.SiteId;
            entity.CustomerId = dto.CustomerId;
            entity.SecondaryCustomerId = dto.SecondaryCustomerId;

            if (dto.Attachments != null && dto.Attachments.Any())
            {
                // Remove old attachments entirely for simplicity
                _context.ProjectTechnicalHandoverAttachments.RemoveRange(entity.Attachments);
                entity.Attachments.Clear();

                foreach (var file in dto.Attachments)
                {
                    if (file.Length > 0)
                    {
                        string fileExtension = Path.GetExtension(file.FileName);
                        string fileName = $"project-handover/{Guid.NewGuid()}{fileExtension}";
                        var url = await _blobService.UploadAsync(file, fileName);

                        entity.Attachments.Add(new ProjectTechnicalHandoverAttachment
                        {
                            FileName = file.FileName,
                            FileUrl = url
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
            return await GetByIdAsync(entity.Id);
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.ProjectTechnicalHandovers.FindAsync(id);
            if (entity != null)
            {
                entity.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }

        private ProjectTechnicalHandoverDto MapToDto(ProjectTechnicalHandover entity)
        {
            return new ProjectTechnicalHandoverDto
            {
                Id = entity.Id,
                SiteId = entity.SiteId,
                SiteName = entity.Site?.Name,
                TenantId = entity.TenantId,
                CustomerId = entity.CustomerId,
                CustomerName = entity.Customer?.Name,
                SecondaryCustomerId = entity.SecondaryCustomerId,
                SecondaryCustomerName = entity.SecondaryCustomer?.Name,
                CreatedByUserName = entity.CreatedByUser?.FullName ?? entity.CreatedByUser?.UserName,
                CreatedAt = entity.CreatedAt,
                Attachments = entity.Attachments?.Select(a => new ProjectTechnicalHandoverAttachmentDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    FileUrl = _blobService.GenerateSasUrl(a.FileUrl, 60, false)
                }).ToList() ?? new List<ProjectTechnicalHandoverAttachmentDto>()
            };
        }
    }
}
