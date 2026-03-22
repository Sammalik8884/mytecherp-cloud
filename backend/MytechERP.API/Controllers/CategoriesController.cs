using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.domain.Roles;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _categoryService.GetAllCategoriesAsync();
            return Ok(categories);
        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto request)
        {
            try
            {
                var newId = await _categoryService.CreateCategoryAsync(request);
                return Ok(new { Id = newId, Message = "Category created successfully." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
        [HttpPut("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Update(int id, [FromBody] CreateCategoryDto request)
        {
            var success = await _categoryService.UpdateCategoryAsync(id, request);
            if (!success) return NotFound("Category not found or access denied.");

            return Ok(new { Message = "Category updated successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _categoryService.DeleteCategoryAsync(id);
                if (!success) return NotFound("Category not found or access denied.");

                return Ok(new { Message = "Category deleted successfully." });
            }
            catch (Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex is Microsoft.EntityFrameworkCore.DbUpdateException)
                {
                    return BadRequest(new { Error = "Cannot delete this category because it has linked products, assets, or checklists. Please delete or reassign those associated records first." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }
    }
}
