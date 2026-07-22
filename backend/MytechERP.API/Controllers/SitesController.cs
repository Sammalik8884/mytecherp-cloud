using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.domain.Constants;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Roles;
using MytechERP.Infrastructure.Persistance;

namespace MytechERP.API.Controllers
{
    [Route("/api/[controller]")]
    [ApiController]
    [Authorize]
    public class SitesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly MytechERP.Application.Interfaces.ICurrentUserService _currentUserService;

        public SitesController(ApplicationDbContext context, MytechERP.Application.Interfaces.ICurrentUserService currentUserService)
        { 
           _context = context;
           _currentUserService = currentUserService;
        }

        [Authorize(Roles = Roles.AllInternal)]
        [HttpGet]
        public async Task<ActionResult<List<SiteDto>>> GetAll()
        {
            var query = _context.Sites.Include(x => x.Customer).AsQueryable();

            if (_currentUserService.Role == Roles.ProcurementExecutive)
            {
                var user = await _context.Users.FindAsync(_currentUserService.UserId);
                if (user != null && user.SiteId.HasValue)
                {
                    query = query.Where(s => s.Id == user.SiteId.Value);
                }
            }

            var sites = await query
                   .OrderByDescending(s => s.Id)
                   .Select(s => new SiteDto
                   {
                       Id = s.Id,
                       Name = s.Name,
                       Address = s.Address,
                       City = s.City,
                       CustomerId = s.CustomerId,
                       CustomerName = s.Customer.Name
                   }).ToListAsync();
            return Ok(sites);
        }
      
        [HttpPost]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Salesman + "," + Roles.ProcurementHead + "," + Roles.ProcurementExecutive + "," + Roles.RegionalHead + "," + Roles.SiteSupervisor)]
        public async Task<ActionResult> Create(CreateSiteDto request)
        {
            int finalCustomerId = request.CustomerId ?? 0;
            if (finalCustomerId == 0)
            {
                var internalCustomer = await _context.Customers.FirstOrDefaultAsync(c => c.Name == "Internal");
                if (internalCustomer == null)
                {
                    internalCustomer = new MytechERP.domain.Entities.CRM.Customer { Name = "Internal", Email = "internal@mytecheng.com", Phone = "000", Address = "Internal" };
                    _context.Customers.Add(internalCustomer);
                    await _context.SaveChangesAsync();
                }
                finalCustomerId = internalCustomer.Id;
            }
            else
            {
                var customerExists = await _context.Customers.AnyAsync(c => c.Id == finalCustomerId);
                if (!customerExists)
                {
                    return BadRequest("Invalid Customer ID. The customer does not exist.");
                }
            }

            var site = new Site
            {
                Name = request.Name,
                Address = request.Address ?? string.Empty,
                City = request.City ?? string.Empty,
                CustomerId = finalCustomerId
            };

            _context.Sites.Add(site);
            await _context.SaveChangesAsync();

            // Auto-seed all active tools into this new site with AvailableQuantity = 0
            var allTools = await _context.StoreTools
                .Where(t => !t.IsDeleted)
                .Select(t => t.Id)
                .ToListAsync();

            foreach (var toolId in allTools)
            {
                _context.SiteToolStocks.Add(new MytechERP.domain.Entities.SiteToolStock
                {
                    SiteId = site.Id,
                    StoreToolId = toolId,
                    AvailableQuantity = 0
                });
            }
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Site Created Successfully", Id = site.Id });
        }
        [Authorize(Roles = Roles.AllInternal)]
        [HttpGet("{id}")]
        public async Task<ActionResult<SiteDto>> GetById(int id)
        {
            var site = await _context.Sites
                .Include(s => s.Customer)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (site == null) return NotFound();

            var dto = new SiteDto
            {
                Id = site.Id,
                Name = site.Name,
                Address = site.Address,
                City = site.City,
                CustomerId = site.CustomerId,
                CustomerName = site.Customer.Name
            };

            return Ok(dto);
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Salesman)]
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, CreateSiteDto request)
        {
            var site = await _context.Sites.FindAsync(id);
            if (site == null) return NotFound();

            if (site.CustomerId != request.CustomerId)
            {
                var customerExists = await _context.Customers.AnyAsync(c => c.Id == request.CustomerId);
                if (!customerExists) return BadRequest("Invalid Customer ID");
            }

            site.Name = request.Name;
            site.Address = request.Address;
            site.City = request.City;
            site.CustomerId = request.CustomerId;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Site Updated Successfully" });
        }

        
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var site = await _context.Sites.FindAsync(id);
                if (site == null) return NotFound();

                _context.Sites.Remove(site);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Site Deleted Successfully" });
            }
            catch (Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex is DbUpdateException)
                {
                    return BadRequest(new { Error = "Cannot delete this site because it has linked records (e.g. assets, work orders). Please delete or reassign those associated records first." });
                }

                return BadRequest(new { Error = "Failed to delete site: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }
    }
}
    
