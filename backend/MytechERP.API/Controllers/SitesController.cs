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
        public SitesController(ApplicationDbContext context)
        { 
           _context = context;
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician + "," + Roles.Estimation + "," + Roles.Salesman)]
        [HttpGet]
        public async Task<ActionResult<List<SiteDto>>> GetAll()
        {
            var sites = await _context.Sites
                   .Include(x => x.Customer)
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
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Salesman)]
        public async Task<ActionResult> Create(CreateSiteDto request)
        {
 
            var customerExists = await _context.Customers.AnyAsync(c => c.Id == request.CustomerId);
            if (!customerExists)
            {
                return BadRequest("Invalid Customer ID. The customer does not exist.");
            }

            
            var site = new Site
            {
                Name = request.Name,
                Address = request.Address,
                City = request.City,
                CustomerId = request.CustomerId
            };

            _context.Sites.Add(site);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Site Created Successfully", Id = site.Id });
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician + "," + Roles.Estimation + "," + Roles.Salesman)]
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
    
