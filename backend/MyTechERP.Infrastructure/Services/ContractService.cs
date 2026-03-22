using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Interfaces;
using MytechERP.Infrastructure.Persistance;
using MyTechERP.Infrastructure.Repositories;
using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class ContractService : IContractService
    {
        private readonly IContractRepository _repository;
        private readonly ICurrentUserService _currentUserService;
        private readonly ApplicationDbContext _context;
        public ContractService(IContractRepository repository, ICurrentUserService currentUserService, ApplicationDbContext context )
        {
            _repository = repository;
            _currentUserService = currentUserService;
            _context = context;
        }
        public async Task<List<ContractDto>> GetAllContractsAsync()
        {
            var userTenantId= _currentUserService.TenantId;

            if (userTenantId == null) { throw new UnauthorizedAccessException("No Tenant ID found. "); }
            var contracts = await _repository.GetAllAsync();
            contracts = contracts.Where(c => c.TenantId == userTenantId).ToList();


            return contracts.Select(c => new ContractDto
            {
                Id = c.Id,
                Title = c.Title,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                VisitFrequencyMonths = c.VisitFrequencyMonths,
                ContractValue = c.ContractValue,
                CustomerName = c.Customer?.Name ?? "Unknown",
                TenantId = userTenantId.Value,
                Description = c.Title,
                Value = c.ContractValue,
                Status = c.IsActive ? 1 : 2,
                ReferenceQuotationId = c.ReferenceQuotationId
            }).ToList();
        }
        public async Task<ContractDto?> GetContractByIdAsync(int id)
        {
            var userTenantId= _currentUserService.TenantId;
            var c = await _repository.GetByIdAsync(id);
            if (c == null) return null;
            if (c.TenantId != userTenantId) return null; 

            return new ContractDto
            {
                Id = c.Id,
                Title = c.Title,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                VisitFrequencyMonths = c.VisitFrequencyMonths,
                ContractValue = c.ContractValue,
                CustomerName = c.Customer?.Name ?? "Unknown",
                Description = c.Title,
                Value = c.ContractValue,
                Status = c.IsActive ? 1 : 2,
                ReferenceQuotationId = c.ReferenceQuotationId
            };
        }
        public async Task<int> CreateContractAsync(CreateContractDto request)
        {
            var userTenantId = _currentUserService.TenantId;
            if (userTenantId == null) throw new UnauthorizedAccessException("No Tenant ID found.");
            var contract = new MytechERP.domain.Entities.CRM.Contract
            {
                Title = !string.IsNullOrEmpty(request.Description) ? request.Description : request.Title,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                VisitFrequencyMonths = request.VisitFrequencyMonths > 0 ? request.VisitFrequencyMonths : 1, // Fallback
                ContractValue = request.Value > 0 ? request.Value : request.ContractValue,
                CustomerId = request.CustomerId,
                IsActive = true,
                TenantId = userTenantId.Value
            };
            var created= await _repository.AddAsync(contract);
            return created.Id;

        }
        public async Task<bool> UpdateContractAsync(int id, UpdateContractDto request)
        {
            if (id != request.Id) return false; 

            
            var contract = await _repository.GetByIdAsync(id);
            if (contract == null) return false;
            if (contract.TenantId != _currentUserService.TenantId) return false;


            contract.Title = request.Title;
            contract.StartDate = request.StartDate;
            contract.EndDate = request.EndDate;
            contract.VisitFrequencyMonths = request.VisitFrequencyMonths;
            contract.ContractValue = request.ContractValue;
            contract.IsActive = request.IsActive;


            await _repository.UpdateAsync(contract);
            return true;
        }
        public async Task<bool> DeleteContractAsync(int id)
        {
            var contracts = await _repository.GetByIdAsync(id);
            if (contracts == null) return false;
            
            if(contracts.TenantId!= _currentUserService.TenantId) { return false; }
            var exists = await _repository.ExistsAsync(id);
            if (!exists) return false;
            await _repository.DeleteAsync(id);
            return true;
        }
        public async Task<bool> AddAssetToContractAsync(CreateContractItemDto dto)
        {
           
            var contract = await _repository.GetByIdAsync(dto.ContractId);
            if (contract == null) throw new Exception("Contract not found");


            var asset = await _context.Assets.FindAsync(dto.AssetId);
            if (asset == null) throw new Exception("Asset not found");


            var item = new ContractItem
            {
                ContractId = dto.ContractId,
                AssetId = dto.AssetId,
                UnitPrice = dto.Price,
                ServiceVisitsPerYear = dto.VisitsPerYear,

                TenantId = contract.TenantId
            };

           
           await _repository.AddContractItemAsync(item);
            return true;
        }
        public async  Task DeleteAssetContractAsync(int id)
        {
            await _repository.DeleteContractItemAsync(id);

        }
    }
}

