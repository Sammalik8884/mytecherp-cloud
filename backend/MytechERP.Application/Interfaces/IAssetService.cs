using MytechERP.Application.DTOs.CRM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public  interface IAssetService
    {
        Task<int> CreateAssetAsync(CreateAssetDto dto);
        Task<List<AssetDto>> GetAllAssetAsync();
        Task<AssetDto?> GetAssetByIdAsync(int id);
        Task<bool> UpdateAssetAsync(int id, UpdateAssetDto request);
        Task<bool> DeleteAssetAsync(int id);
        Task<List<AssetDto>> GetAssetsBySiteIdAsync(int siteId);
    }
}
