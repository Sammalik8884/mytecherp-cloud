
using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using MytechERP.Application.DTOs.CRM;
using MytechERP.domain.Constants;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Roles;
using MytechERP.Infrastructure.Persistance;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public CustomersController(ApplicationDbContext context)
        { _context = context; }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician + "," + Roles.Salesman + "," + Roles.Estimation)]
        [HttpGet]
        public async Task<ActionResult<List<CustomerDto>>> GetAll()
        {
            var customers = await _context.Customers.OrderByDescending(x => x.Id).Select(x => new CustomerDto
            {
                Id = x.Id,
                Name = x.Name,
                Email = x.Email,
                Phone = x.Phone,
                Address = x.Address,
                IsProspect = x.IsProspect,
                ContactPersonName = x.ContactPersonName,
                HasVisitingCard = x.HasVisitingCard,
                ContractorCompanyName = x.ContractorCompanyName,
                FurtherDetails = x.FurtherDetails
            }).ToListAsync();
            return Ok(customers);
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Salesman)]
        [HttpPost]
        public async Task<ActionResult> Create(CreateCustomerDto request)
        {


            var customer = new Customer
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Address = request.Address,
                TaxNumber = request.TaxNumber,
                IsProspect = request.IsProspect
            };

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            if (userRole == Roles.Salesman)
            {
                customer.IsProspect = true;
            }
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Customer Created Successfuly", Id = customer.Id });
        }
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician + "," + Roles.Salesman + "," + Roles.Estimation)]
        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerDto>> GetById(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) { return NotFound(); }
            var dto = new CustomerDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Address = customer.Address,
                IsProspect = customer.IsProspect,
                ContactPersonName = customer.ContactPersonName,
                HasVisitingCard = customer.HasVisitingCard,
                ContractorCompanyName = customer.ContractorCompanyName,
                FurtherDetails = customer.FurtherDetails
            };
            return Ok(dto);

        }
        [HttpPut("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Salesman)]
        public async Task<IActionResult> Update(int id, CreateCustomerDto request)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) { return NotFound(); };

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            if (userRole == Roles.Salesman && !customer.IsProspect)
            {
                return Forbid();
            }

            customer.Name = request.Name;
            customer.Email = request.Email;
            customer.Phone = request.Phone;
            customer.Address = request.Address;
            customer.TaxNumber = request.TaxNumber;
            if (userRole != Roles.Salesman) {
                customer.IsProspect = request.IsProspect;
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Customer updated Successfuly" });
        }
        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<ActionResult> Delete(int id)
        {
            Console.WriteLine($"[DEBUG] Attempting to delete Customer ID: {id}");
            try 
            {
                var customer = await _context.Customers.FindAsync(id);
                if (customer == null) { return NotFound(); }
                    _context.Customers.Remove(customer);
                    await _context.SaveChangesAsync();
                    return Ok(new { Message = "Customer deleted successfuly" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to delete customer {id}. Exception Type: {ex.GetType().Name}. Message: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[ERROR] Inner Exception: {ex.InnerException.Message}");
                }
                Console.WriteLine($"[ERROR] Stack Trace: {ex.StackTrace}");

                // Check if the error is related to foreign key constraints
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex is DbUpdateException)
                {
                    return BadRequest(new { Error = "Cannot delete this customer because they have linked records (e.g. sites, invoices, quotes). Please delete or reassign those associated records first." });
                }

                // If it's a completely different error, return it so the frontend can display it, avoiding the fallback
                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }


    }
}
