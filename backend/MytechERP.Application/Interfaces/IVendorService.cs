using MytechERP.Application.DTOs.Procurement;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IVendorService
    {
        Task<List<VendorDto>> GetAllAsync();
        Task<VendorDto> CreateAsync(VendorDto dto);
        Task<VendorDto> UpdateAsync(int id, VendorDto dto);
        Task DeleteAsync(int id);
    }
}
