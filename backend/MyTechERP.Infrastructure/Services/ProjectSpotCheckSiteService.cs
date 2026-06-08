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
    public class ProjectSpotCheckSiteService : IProjectSpotCheckSiteService
    {
        private readonly ApplicationDbContext _context;

        public ProjectSpotCheckSiteService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProjectSpotCheckSiteDto> CreateAsync(CreateProjectSpotCheckSiteDto dto, string userId)
        {
            var spotCheck = new ProjectSpotCheckSite
            {
                SiteId = dto.SiteId,
                CreatedByUserId = userId,
                UploadedFiles = dto.UploadedFiles,
                Items = dto.Items.Select(i => new ProjectSpotCheckSiteItem
                {
                    ItemText = i.ItemText,
                    IsYes = i.IsYes,
                    IsNA = i.IsNA,
                    Comments = i.Comments,
                    CreatedByUserId = userId
                }).ToList()
            };

            _context.ProjectSpotCheckSites.Add(spotCheck);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(spotCheck.Id);
        }

        public async Task<ProjectSpotCheckSiteDto> UpdateAsync(int id, CreateProjectSpotCheckSiteDto dto, string userId)
        {
            var spotCheck = await _context.ProjectSpotCheckSites
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (spotCheck == null)
            {
                throw new Exception("ProjectSpotCheckSite not found");
            }

            spotCheck.SiteId = dto.SiteId;
            spotCheck.UploadedFiles = dto.UploadedFiles;

            _context.ProjectSpotCheckSiteItems.RemoveRange(spotCheck.Items);

            spotCheck.Items = dto.Items.Select(i => new ProjectSpotCheckSiteItem
            {
                ItemText = i.ItemText,
                IsYes = i.IsYes,
                IsNA = i.IsNA,
                Comments = i.Comments,
                CreatedByUserId = userId
            }).ToList();

            await _context.SaveChangesAsync();

            return await GetByIdAsync(spotCheck.Id);
        }

        public async Task<ProjectSpotCheckSiteDto> GetByIdAsync(int id)
        {
            var spotCheck = await _context.ProjectSpotCheckSites
                .Include(p => p.Site)
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (spotCheck == null) return null;

            return new ProjectSpotCheckSiteDto
            {
                Id = spotCheck.Id,
                SiteId = spotCheck.SiteId,
                SiteName = spotCheck.Site?.Name,
                CreatedAt = spotCheck.CreatedAt,
                UploadedFiles = spotCheck.UploadedFiles,
                Items = spotCheck.Items.Select(i => new ProjectSpotCheckSiteItemDto
                {
                    Id = i.Id,
                    ItemText = i.ItemText,
                    IsYes = i.IsYes,
                    IsNA = i.IsNA,
                    Comments = i.Comments
                }).ToList()
            };
        }

        public async Task<IEnumerable<ProjectSpotCheckSiteDto>> GetAllAsync()
        {
            var spotChecks = await _context.ProjectSpotCheckSites
                .Include(p => p.Site)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return spotChecks.Select(spotCheck => new ProjectSpotCheckSiteDto
            {
                Id = spotCheck.Id,
                SiteId = spotCheck.SiteId,
                SiteName = spotCheck.Site?.Name,
                CreatedAt = spotCheck.CreatedAt,
                UploadedFiles = spotCheck.UploadedFiles
            });
        }

        public async Task DeleteAsync(int id)
        {
            var spotCheck = await _context.ProjectSpotCheckSites.FindAsync(id);
            if (spotCheck != null)
            {
                _context.ProjectSpotCheckSites.Remove(spotCheck);
                await _context.SaveChangesAsync();
            }
        }
    }
}
