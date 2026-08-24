using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services
{
    public class IncidentRecordService : IIncidentRecordService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly UserManager<AppUser> _userManager;
        private readonly INotificationService _notificationService;

        public IncidentRecordService(
            ApplicationDbContext context, 
            ICurrentUserService currentUserService,
            UserManager<AppUser> userManager,
            INotificationService notificationService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _userManager = userManager;
            _notificationService = notificationService;
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

            // Notify Admins, Managers, and Faisal Ghani
            var admins = await _userManager.GetUsersInRoleAsync("Admin");
            var managers = await _userManager.GetUsersInRoleAsync("Manager");
            
            var allRecipients = admins.Concat(managers).ToList();
            
            var faisal = await _userManager.FindByEmailAsync("faisal.ghani@mytecheng.com");
            if (faisal != null && !allRecipients.Any(u => u.Id == faisal.Id))
            {
                allRecipients.Add(faisal);
            }
            
            var majeed = await _userManager.FindByEmailAsync("abdul.majeed@mytecheng.com");
            if (majeed != null && !allRecipients.Any(u => u.Id == majeed.Id))
            {
                allRecipients.Add(majeed);
            }

            var creatorName = _currentUserService.UserId != null ? (await _userManager.FindByIdAsync(_currentUserService.UserId))?.FullName ?? "Someone" : "Someone";
            string siteName = entity.SiteId > 0 ? (await _context.Sites.FindAsync(entity.SiteId))?.Name : "Unknown Site";

            foreach (var recipient in allRecipients)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: recipient.Id,
                    title: "New Incident Record",
                    message: $"{creatorName} submitted a new Incident Record for {siteName}.",
                    type: "IncidentRecord",
                    targetId: entity.Id
                );
            }

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
