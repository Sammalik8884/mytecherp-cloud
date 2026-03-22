using MytechERP.Application.DTOs.CRM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface ICategoryService
    {
        Task<int> CreateCategoryAsync(CreateCategoryDto dto);
        Task<List<CategoryDto>> GetAllCategoriesAsync();
        Task<bool> UpdateCategoryAsync(int id, CreateCategoryDto dto);
        Task<bool> DeleteCategoryAsync(int id);
    }
}
