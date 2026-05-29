using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MytechERP.Infrastructure.Persistance;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;

namespace MyTechERP.Infrastructure.Services
{
    public class MaterialReceivingService : IMaterialReceivingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public MaterialReceivingService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<MaterialReceivingFormDto> GetFormByIdAsync(int id)
        {
            var form = await _context.Set<MaterialReceivingForm>()
                .Include(f => f.Items)
                .Include(f => f.Site)
                .Include(f => f.CreatedByUser)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (form == null) return null;

            return new MaterialReceivingFormDto
            {
                Id = form.Id,
                SiteId = form.SiteId,
                SiteName = form.Site?.Name,
                Location = form.Location,
                CreatedAt = form.CreatedAt,
                CreatedByUserName = form.CreatedByUser?.UserName ?? string.Empty,
                Items = form.Items.Select(i => new MaterialReceivingItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    LocationValue = i.LocationValue,
                    Received = i.Received,
                    Remarks = i.Remarks
                }).ToList()
            };
        }

        public async Task<List<MaterialReceivingFormDto>> GetFormsBySiteIdAsync(int siteId)
        {
            var forms = await _context.Set<MaterialReceivingForm>()
                .Include(f => f.Items)
                .Include(f => f.Site)
                .Include(f => f.CreatedByUser)
                .Where(f => f.SiteId == siteId)
                .ToListAsync();

            return forms.Select(form => new MaterialReceivingFormDto
            {
                Id = form.Id,
                SiteId = form.SiteId,
                SiteName = form.Site?.Name,
                Location = form.Location,
                CreatedAt = form.CreatedAt,
                CreatedByUserName = form.CreatedByUser?.UserName ?? string.Empty,
                Items = form.Items.Select(i => new MaterialReceivingItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    LocationValue = i.LocationValue,
                    Received = i.Received,
                    Remarks = i.Remarks
                }).ToList()
            }).ToList();
        }

        public async Task<List<MaterialReceivingFormDto>> GetFormsByLocationAsync(string location)
        {
            var forms = await _context.Set<MaterialReceivingForm>()
                .Include(f => f.Items)
                .Include(f => f.Site)
                .Include(f => f.CreatedByUser)
                .Where(f => f.Location == location)
                .ToListAsync();

            return forms.Select(form => new MaterialReceivingFormDto
            {
                Id = form.Id,
                SiteId = form.SiteId,
                SiteName = form.Site?.Name,
                Location = form.Location,
                CreatedAt = form.CreatedAt,
                CreatedByUserName = form.CreatedByUser?.UserName ?? string.Empty,
                Items = form.Items.Select(i => new MaterialReceivingItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    LocationValue = i.LocationValue,
                    Received = i.Received,
                    Remarks = i.Remarks
                }).ToList()
            }).ToList();
        }

        public async Task<MaterialReceivingFormDto> CreateFormAsync(CreateMaterialReceivingFormDto dto)
        {
            var form = new MaterialReceivingForm
            {
                SiteId = dto.SiteId,
                Location = dto.Location,
                TenantId = _currentUserService.TenantId.GetValueOrDefault(),
                CreatedByUserId = _currentUserService.UserId ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                Items = dto.Items.Select(i => new MaterialReceivingItem
                {
                    ItemName = i.ItemName,
                    LocationValue = i.LocationValue,
                    Received = i.Received,
                    Remarks = i.Remarks
                }).ToList()
            };

            _context.Set<MaterialReceivingForm>().Add(form);
            await _context.SaveChangesAsync();

            return await GetFormByIdAsync(form.Id);
        }

        public async Task<MaterialReceivingFormDto> UpdateFormAsync(int id, CreateMaterialReceivingFormDto dto)
        {
            var form = await _context.Set<MaterialReceivingForm>()
                .Include(f => f.Items)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (form == null) throw new KeyNotFoundException("Form not found");

            form.SiteId = dto.SiteId;
            form.Location = dto.Location;

            _context.Set<MaterialReceivingItem>().RemoveRange(form.Items);
            
            form.Items = dto.Items.Select(i => new MaterialReceivingItem
            {
                ItemName = i.ItemName,
                LocationValue = i.LocationValue,
                Received = i.Received,
                Remarks = i.Remarks
            }).ToList();

            await _context.SaveChangesAsync();
            return await GetFormByIdAsync(form.Id);
        }

        public async Task DeleteFormAsync(int id)
        {
            var form = await _context.Set<MaterialReceivingForm>()
                .FirstOrDefaultAsync(f => f.Id == id);
            
            if (form != null)
            {
                _context.Set<MaterialReceivingForm>().Remove(form);
                await _context.SaveChangesAsync();
            }
        }
    }
}
