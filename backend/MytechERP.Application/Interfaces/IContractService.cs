using MytechERP.Application.DTOs.CRM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IContractService
    {
        Task<int> CreateContractAsync(CreateContractDto dto);
        Task<List<ContractDto>> GetAllContractsAsync();
        Task<ContractDto?> GetContractByIdAsync(int id);
        Task<bool> UpdateContractAsync(int id, UpdateContractDto request);
        Task<bool> DeleteContractAsync(int id);
        Task<bool> AddAssetToContractAsync(CreateContractItemDto dto);
        Task DeleteAssetContractAsync(int id);
    }
}
