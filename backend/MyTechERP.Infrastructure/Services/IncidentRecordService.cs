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
    public class IncidentRecordService : IIncidentRecordService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public IncidentRecordService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<IncidentRecordDto> CreateAsync(CreateIncidentRecordDto dto, string userId)
        {
            var tenantId = _currentUserService.TenantId ?? 0;

            var entity = new IncidentRecord
            {
                TenantId = tenantId,
                SiteId = dto.SiteId,
                Doc = dto.Doc,
                Issue = dto.Issue,
                IssueDate = dto.IssueDate,
                Items = dto.Items.Select(i => new IncidentRecordItem
                {
                    Date = i.Date,
                    DescriptionOfIncident = i.DescriptionOfIncident,
                    ToWhom = i.ToWhom,
                    Department = i.Department,
                    CorrectiveAction = i.CorrectiveAction,
                    Remarks = i.Remarks
                }).ToList()
            };

            _context.IncidentRecords.Add(entity);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(entity.Id);
        }

        public async Task<IncidentRecordDto> UpdateAsync(int id, CreateIncidentRecordDto dto, string userId)
        {
            var tenantId = _currentUserService.TenantId ?? 0;

            var entity = await _context.IncidentRecords
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId && !x.IsDeleted);

            if (entity == null) throw new System.Exception("Incident Record not found");

            entity.SiteId = dto.SiteId;
            entity.Doc = dto.Doc;
            entity.Issue = dto.Issue;
            entity.IssueDate = dto.IssueDate;

            _context.IncidentRecordItems.RemoveRange(entity.Items);

            entity.Items = dto.Items.Select(i => new IncidentRecordItem
            {
                Date = i.Date,
                DescriptionOfIncident = i.DescriptionOfIncident,
                ToWhom = i.ToWhom,
                Department = i.Department,
                CorrectiveAction = i.CorrectiveAction,
                Remarks = i.Remarks
            }).ToList();

            await _context.SaveChangesAsync();

            return await GetByIdAsync(entity.Id);
        }

        public async Task<IncidentRecordDto> GetByIdAsync(int id)
        {
            var tenantId = _currentUserService.TenantId ?? 0;

            var entity = await _context.IncidentRecords
                .Include(x => x.Site)
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId && !x.IsDeleted);

            if (entity == null) return null;

            return new IncidentRecordDto
            {
                Id = entity.Id,
                SiteId = entity.SiteId,
                SiteName = entity.Site?.Name ?? string.Empty,
                Doc = entity.Doc,
                Issue = entity.Issue,
                IssueDate = entity.IssueDate,
                CreatedAt = entity.CreatedAt,
                Items = entity.Items.Select(i => new IncidentRecordItemDto
                {
                    Id = i.Id,
                    Date = i.Date,
                    DescriptionOfIncident = i.DescriptionOfIncident,
                    ToWhom = i.ToWhom,
                    Department = i.Department,
                    CorrectiveAction = i.CorrectiveAction,
                    Remarks = i.Remarks
                }).ToList()
            };
        }

        public async Task<IEnumerable<IncidentRecordDto>> GetAllAsync()
        {
            var tenantId = _currentUserService.TenantId ?? 0;

            var entities = await _context.IncidentRecords
                .Include(x => x.Site)
                .Include(x => x.Items)
                .Where(x => x.TenantId == tenantId && !x.IsDeleted)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return entities.Select(entity => new IncidentRecordDto
            {
                Id = entity.Id,
                SiteId = entity.SiteId,
                SiteName = entity.Site?.Name ?? string.Empty,
                Doc = entity.Doc,
                Issue = entity.Issue,
                IssueDate = entity.IssueDate,
                CreatedAt = entity.CreatedAt,
                Items = entity.Items.Select(i => new IncidentRecordItemDto
                {
                    Id = i.Id,
                    Date = i.Date,
                    DescriptionOfIncident = i.DescriptionOfIncident,
                    ToWhom = i.ToWhom,
                    Department = i.Department,
                    CorrectiveAction = i.CorrectiveAction,
                    Remarks = i.Remarks
                }).ToList()
            });
        }

        public async Task DeleteAsync(int id)
        {
            var tenantId = _currentUserService.TenantId ?? 0;

            var entity = await _context.IncidentRecords
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId && !x.IsDeleted);

            if (entity != null)
            {
                entity.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }
    }
}
