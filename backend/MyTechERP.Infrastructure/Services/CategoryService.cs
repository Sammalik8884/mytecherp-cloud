using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class CategoryService:  ICategoryService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public CategoryService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<int> CreateCategoryAsync(CreateCategoryDto dto)
        {
            var tenantId = _currentUserService.TenantId ?? throw new UnauthorizedAccessException("Tenant ID missing.");

            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description,
                TenantId = tenantId
            };

            _context.Categories.Add(category); 
            await _context.SaveChangesAsync();
            return category.Id;
        }

        public async Task<List<CategoryDto>> GetAllCategoriesAsync()
        {
            var tenantId = _currentUserService.TenantId;

            return await _context.Categories
                .Where(c => c.TenantId == tenantId)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description
                })
                .ToListAsync();
        }
        public async Task<bool> UpdateCategoryAsync(int id, CreateCategoryDto dto)
        {
            var tenantId = _currentUserService.TenantId;
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (category == null) return false;

            category.Name = dto.Name;
            category.Description = dto.Description;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var tenantId = _currentUserService.TenantId;
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (category == null) return false;

            var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == id && p.TenantId == tenantId);
            if (hasProducts)
            {
                throw new InvalidOperationException("Cannot delete this category because there are products attached to it. Reassign the products first.");
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
