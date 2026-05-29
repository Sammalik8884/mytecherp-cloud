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
    public class ItemProcurementService : IItemProcurementService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public ItemProcurementService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<List<ItemProcurementDto>> GetAllItemProcurementsAsync(int? siteId = null)
        {
            var query = _context.ItemProcurements
                .Include(ip => ip.Site)
                .Include(ip => ip.CreatedByUser)
                .Include(ip => ip.Items)
                .AsQueryable();

            if (siteId.HasValue)
            {
                query = query.Where(ip => ip.SiteId == siteId.Value);
            }

            var procurements = await query.OrderByDescending(ip => ip.Date).ToListAsync();

            return procurements.Select(ip => new ItemProcurementDto
            {
                Id = ip.Id,
                SiteId = ip.SiteId,
                SiteName = ip.Site?.Name,
                Date = ip.Date,
                Remarks = ip.Remarks,
                CreatedByUserName = ip.CreatedByUser?.UserName,
                Items = ip.Items.Select(i => new ItemProcurementItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    Remarks = i.Remarks
                }).ToList()
            }).ToList();
        }

        public async Task<ItemProcurementDto> GetItemProcurementByIdAsync(int id)
        {
            var ip = await _context.ItemProcurements
                .Include(ip => ip.Site)
                .Include(ip => ip.CreatedByUser)
                .Include(ip => ip.Items)
                .FirstOrDefaultAsync(ip => ip.Id == id);

            if (ip == null) return null;

            return new ItemProcurementDto
            {
                Id = ip.Id,
                SiteId = ip.SiteId,
                SiteName = ip.Site?.Name,
                Date = ip.Date,
                Remarks = ip.Remarks,
                CreatedByUserName = ip.CreatedByUser?.UserName,
                Items = ip.Items.Select(i => new ItemProcurementItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    Remarks = i.Remarks
                }).ToList()
            };
        }

        public async Task<ItemProcurementDto> CreateItemProcurementAsync(CreateItemProcurementDto dto)
        {
            var ip = new ItemProcurement
            {
                SiteId = dto.SiteId,
                Date = dto.Date,
                Remarks = dto.Remarks,
                CreatedByUserId = _currentUserService.UserId,
                TenantId = _currentUserService.TenantId ?? 0,
                Items = dto.Items.Select(i => new ItemProcurementItem
                {
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    Remarks = i.Remarks,
                    TenantId = _currentUserService.TenantId ?? 0
                }).ToList()
            };

            _context.ItemProcurements.Add(ip);
            await _context.SaveChangesAsync();

            return await GetItemProcurementByIdAsync(ip.Id);
        }

        public async Task<ItemProcurementDto> UpdateItemProcurementAsync(int id, CreateItemProcurementDto dto)
        {
            var ip = await _context.ItemProcurements
                .Include(ip => ip.Items)
                .FirstOrDefaultAsync(ip => ip.Id == id);

            if (ip == null) throw new Exception("Item Procurement not found");

            ip.SiteId = dto.SiteId;
            ip.Date = dto.Date;
            ip.Remarks = dto.Remarks;

            _context.ItemProcurementItems.RemoveRange(ip.Items);

            ip.Items = dto.Items.Select(i => new ItemProcurementItem
            {
                ItemName = i.ItemName,
                Quantity = i.Quantity,
                Remarks = i.Remarks,
                TenantId = _currentUserService.TenantId ?? 0
            }).ToList();

            await _context.SaveChangesAsync();

            return await GetItemProcurementByIdAsync(ip.Id);
        }

        public async Task<bool> DeleteItemProcurementAsync(int id)
        {
            var ip = await _context.ItemProcurements.FindAsync(id);
            if (ip == null) return false;

            ip.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
