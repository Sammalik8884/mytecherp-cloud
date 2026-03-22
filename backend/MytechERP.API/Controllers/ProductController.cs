    using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs;
using MytechERP.Application.Filters;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.domain.Roles;
using MytechERP.Infrastructure.Persistance;
using MyTechERP.API.Helpers;
using MyTechERP.Infrastructure.Services; 
using System.Linq.Expressions;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProductController : ControllerBase
    {
        private readonly IGenericRepository<Product> _genericRepository;
        private readonly IFileService _fileService;
        private readonly IProductImportService _importService;
        private readonly ICurrentUserService _currentUserService;
        private readonly ApplicationDbContext _context;

        public ProductController( ApplicationDbContext context,
            IGenericRepository<Product> genericRepository,
            IFileService fileService,
            IProductImportService importService,
            ICurrentUserService currentUserService )
        {
            _genericRepository = genericRepository;
            _fileService = fileService;
            _importService = importService;
            _currentUserService = currentUserService;
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        public async Task<IActionResult> GetAll([FromQuery] PaginationFilter filter)
        {
            var searchFilter = ProductSearchHelper.GetSearchExpression(filter.SearchText);

            var data = await _genericRepository.GetPagedResponseAsync(
                filter.PageNumber,
                filter.PageSize,
                includeProperties: "Category",
                searchFilter
            );

            return Ok(data);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician)]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _genericRepository.GetByIdAsync(id, includeProperties: "Category");
            if (product == null) return NotFound();
            return Ok(product);
        }


        [HttpPost("create-manual")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Create([FromForm] CreateProductDto request)
        {
            var category = await _context.Categories
      .FirstOrDefaultAsync(c => c.Id == request.CategoryId);

            if (category == null)
                return BadRequest("Invalid category for this tenant.");

            string? ImageUrl = null;
            if (request.Image != null)
            {
                ImageUrl = await _fileService.SaveFileAsync(request.Image, "products");
            }

            var newProduct = new Product
            {
                Name = request.Name,
                Price = request.Price,
                CostPrice = request.CostPrice,
                ReorderLevel = request.ReorderLevel,
                CategoryId = request.CategoryId,
                ImageUrl = ImageUrl,
                TenantId = category.TenantId,
                PriceAED = request.PriceAED,
                Description = request.Description ?? request.Name,
                Brand = request.Brand ?? "Generic",
                ItemCode = request.ItemCode,
                TechnicalSpecs = "{}"
            };

            await _genericRepository.AddAsync(newProduct);
            return Ok(new { message = "Product created!", id = newProduct.Id });
        }


        [HttpPost("import-excel")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> ImportExcel(IFormFile file, [FromQuery] string brand = "LIFECO")
        {
            if (file == null || file.Length == 0) return BadRequest("File is empty");

            try
            {
               
                int tenantId = _currentUserService.TenantId ?? 1;

               
                var result = await _importService.ImportExcelAsync(file, brand, tenantId);
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var product = await _genericRepository.GetByIdAsync(id);
                if (product == null) { return NotFound(); }
                await _genericRepository.DeleteAsync(product);
                return Ok(new { message = "Product is deleted!" });
            }
            catch (Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex is DbUpdateException)
                {
                    return BadRequest(new { Error = "Cannot delete this product because it has linked records (e.g. stock, invoices, purchase orders, or quotes). Please delete or reassign those associated records first." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }

        
        [HttpPut("{id}")]

        [Authorize(Roles = Roles.Admin +","+Roles.Manager)]
        public async Task<IActionResult> Update(int id, [FromForm] CreateProductDto request)
        {
            var existingProduct = await _genericRepository.GetByIdAsync(id);
            if (existingProduct == null)
                return NotFound($"Product with ID : {id} is not found");

            // 🔥 Get category properly
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == request.CategoryId);

            if (category == null)
                return BadRequest("Invalid category for this tenant.");

            // Update fields
            existingProduct.Name = request.Name;
            existingProduct.Price = request.Price;
            existingProduct.CategoryId = request.CategoryId;

            // 🔥 Keep tenant aligned
            existingProduct.TenantId = category.TenantId;

            if (request.Image != null)
            {
                existingProduct.ImageUrl =
                    await _fileService.SaveFileAsync(request.Image, "products");
            }

            existingProduct.PriceAED = request.PriceAED;

            if (!string.IsNullOrEmpty(request.Description))
                existingProduct.Description = request.Description;

            if (!string.IsNullOrEmpty(request.Brand))
                existingProduct.Brand = request.Brand;

            if (!string.IsNullOrEmpty(request.ItemCode))
                existingProduct.ItemCode = request.ItemCode;

            await _genericRepository.UpdateAsync(existingProduct);

            return NoContent();
        }
    }
}