using MytechERP.domain.Entities.CRM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Interfaces
{
    public interface IAssetRepository
    {
        Task<Asset> AddAsync(Asset asset);
        Task<List<Asset>> GetAllAsync();
        Task<Asset?> GetIdAsync(int id);
        Task UpdateAsync(Asset asset);
        Task DeleteAsync(int id);
    }
}
