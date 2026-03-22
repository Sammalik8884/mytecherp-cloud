using Azure.Core;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Interfaces;
using MytechERP.Infrastructure.Persistance;
using static MytechERP.domain.Constants.Permissions;

namespace MyTechERP.Infrastructure.Services
{
    public class AssetService : IAssetService
    {
        private readonly IAssetRepository _assetRepository;
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public AssetService(IAssetRepository assetRepository, ApplicationDbContext context, ICurrentUserService currentUserService  )
        {
            _assetRepository = assetRepository;
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<int> CreateAssetAsync(CreateAssetDto dto)
        {
            var userTenantId = _currentUserService.TenantId;
            if (userTenantId == null) throw new UnauthorizedAccessException("No Tenant ID found.");

            var site = await _context.Sites.FindAsync(dto.SiteId);
            if (site == null)
            {
                throw new Exception("Invalid Site ID. Cannot create asset.");
            }
            if (site.TenantId != userTenantId)
            {
                throw new UnauthorizedAccessException("Cannot add assets to a site defined in another Tenant.");
            }


            var asset = new Asset
            {
                Name = dto.Name,
                SerialNumber = dto.SerialNumber,

                AssetType = dto.AssetType,
                Status = dto.Status,
                TenantId = userTenantId.Value,

                LocationDescription = dto.Location,
                Floor = dto.Floor,
                Room = dto.Room,

                SiteId = dto.SiteId,
                CategoryId = dto.CategoryId > 0 ? dto.CategoryId : (site.CategoryId > 0 ? site.CategoryId : 1), // Fallback to Category 1 if none provided
                Brand = dto.Brand,
                Model = dto.Model ?? "",
                ManufacturingDate = dto.ManufacturingDate,
                ExpiryDate = dto.ManufacturingDate.AddYears(5)
            };

            var created = await _assetRepository.AddAsync(asset);
            return created.Id;
        }

        public async Task<List<AssetDto>> GetAssetsBySiteIdAsync(int siteId)
        {
            var assets = await _context.Assets
                .Where(a => a.SiteId == siteId)
                .Include(a => a.Site)
                .ToListAsync();

            return MapToDto(assets);
        }

        public async Task<List<AssetDto>> GetAllAssetAsync()
        {
            var userTenantId = _currentUserService.TenantId;

            var assets = await _context.Assets 
        .Include(a => a.Site)
        .Where(a => a.TenantId == userTenantId)
        .OrderByDescending(a => a.Id)
        .ToListAsync();
            return MapToDto(assets);
        }

        public async Task<AssetDto?> GetAssetByIdAsync(int id)
        {
            var userTenantId = _currentUserService.TenantId;

            var asset = await _context.Assets
        .Include(a => a.Site)
        .FirstOrDefaultAsync(a => a.Id == id);
            if (asset == null) return null;
            if (asset.TenantId != userTenantId) return null;
            return MapToDto(new[] { asset }).FirstOrDefault();

            


        }

        public async Task<bool> UpdateAssetAsync(int id, UpdateAssetDto request)
        {
            var asset = await _assetRepository.GetIdAsync(id);
            if (asset == null) return false;
            if (asset.TenantId != _currentUserService.TenantId) return false;


            asset.Name = request.Name;
            asset.SerialNumber = request.SerialNumber;
            asset.AssetType = request.AssetType;
            asset.Status = request.Status;
            asset.LocationDescription = request.Location;
            asset.Floor = request.Floor;
            asset.Room = request.Room;
            asset.Brand = request.Brand;
            if (request.SiteId > 0) asset.SiteId = request.SiteId;
            if (request.CategoryId > 0) asset.CategoryId = request.CategoryId;

            await _assetRepository.UpdateAsync(asset);
            return true;
        }

        public async Task<bool> DeleteAssetAsync(int id)
        {

            var asset = await _assetRepository.GetIdAsync(id);
            if (asset == null) return false;

            if (asset.TenantId != _currentUserService.TenantId) return false;

            await _assetRepository.DeleteAsync(id);
            return true;
        }

        private List<AssetDto> MapToDto(IEnumerable<Asset> assets)
        {
            return assets.Select(a => new AssetDto
            {
                Id = a.Id,
                Name = a.Name,
                SerialNumber = a.SerialNumber,

               
                AssetType = a.AssetType.ToString(),
                AssetTypeId = (int)a.AssetType, 

                
                Status = a.Status.ToString(),
                Location = a.LocationDescription,
                Floor = a.Floor ?? "",
                Room = a.Room ?? "",

                SiteName = a.Site?.Name ?? "Unknown Site",
                Brand = a.Brand,
                ExpiryDate = a.ExpiryDate
            }).ToList();
        }
    }
}