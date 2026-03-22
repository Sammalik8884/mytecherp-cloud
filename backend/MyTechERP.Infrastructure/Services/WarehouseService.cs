using MytechERP.Application.DTOs.Inventory;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Inventory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class WarehouseService : IWarehouseService
    {
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly ICurrentUserService _currentUserService;

        public WarehouseService(IWarehouseRepository warehouseRepository, ICurrentUserService currentUserService)
        {
            _warehouseRepository = warehouseRepository;
            _currentUserService = currentUserService;
        }

        private int GetTenantId()
        {
            var tenantId = _currentUserService.TenantId;
            if (tenantId == null)
            {
                throw new UnauthorizedAccessException("Tenant ID is missing.");
            }
            return tenantId.Value;
        }

        public async Task<List<WarehouseDto>> GetAllAsync()
        {
            int tenantId = GetTenantId();
            var warehouses = await _warehouseRepository.GetAllAsync(tenantId);
            return warehouses.Select(w => new WarehouseDto
            {
                Id = w.Id,
                Name = w.Name,
                Location = w.Location,
                IsMobile = w.IsMobile
            }).ToList();
        }

        public async Task<WarehouseDto?> GetByIdAsync(int id)
        {
            int tenantId = GetTenantId();
            var warehouse = await _warehouseRepository.GetByIdAsync(id, tenantId);
            if (warehouse == null) return null;

            return new WarehouseDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Location = warehouse.Location,
                IsMobile = warehouse.IsMobile
            };
        }

        public async Task<WarehouseDto> CreateAsync(CreateWarehouseDto dto)
        {
            int tenantId = GetTenantId();
            var warehouse = new Warehouse
            {
                Name = dto.Name,
                Location = dto.Location,
                IsMobile = dto.IsMobile,
                TenantId = tenantId
            };

            await _warehouseRepository.AddAsync(warehouse);

            return new WarehouseDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Location = warehouse.Location,
                IsMobile = warehouse.IsMobile
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdateWarehouseDto dto)
        {
            int tenantId = GetTenantId();
            var warehouse = await _warehouseRepository.GetByIdAsync(id, tenantId);
            if (warehouse == null) return false;

            warehouse.Name = dto.Name;
            warehouse.Location = dto.Location;
            warehouse.IsMobile = dto.IsMobile;
            warehouse.UpdatedAt = DateTime.UtcNow;

            await _warehouseRepository.UpdateAsync(warehouse);
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            int tenantId = GetTenantId();
            var warehouse = await _warehouseRepository.GetByIdAsync(id, tenantId);
            if (warehouse == null) return false;

            warehouse.IsDeleted = true;
            warehouse.UpdatedAt = DateTime.UtcNow;
            await _warehouseRepository.UpdateAsync(warehouse);
            return true;
        }
    }
}
