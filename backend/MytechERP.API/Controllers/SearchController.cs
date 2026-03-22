using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs;
using MytechERP.Application.Interfaces;
using MytechERP.Infrastructure.Persistance;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public SearchController(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<ActionResult<List<GlobalSearchDto>>> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(new List<GlobalSearchDto>());

            q = q.ToLower().Trim();
            var tenantId = _currentUserService.TenantId;
            var results = new List<GlobalSearchDto>();
            int limit = 5;

            // ─── CRM ──────────────────────────────────────────────────────
            // Customers
            var customers = await _context.Customers
                .Where(c => c.TenantId == tenantId &&
                           (c.CompanyName.ToLower().Contains(q) || c.Email.ToLower().Contains(q)))
                .Take(limit)
                .Select(c => new GlobalSearchDto { Id = c.Id.ToString(), Title = c.CompanyName, Subtitle = c.Email ?? "Customer", Type = "Customer", Path = "/customers" })
                .ToListAsync();
            results.AddRange(customers);

            // Sites
            var sites = await _context.Sites
                .Include(s => s.Customer)
                .Where(s => s.TenantId == tenantId &&
                           (s.Name.ToLower().Contains(q) || s.Address.ToLower().Contains(q)))
                .Take(limit)
                .Select(s => new GlobalSearchDto { Id = s.Id.ToString(), Title = s.Name, Subtitle = s.Customer != null ? s.Customer.CompanyName : "Site", Type = "Site", Path = "/sites" })
                .ToListAsync();
            results.AddRange(sites);

            // Contracts
            var contracts = await _context.Contracts
                .Include(c => c.Customer)
                .Where(c => c.TenantId == tenantId &&
                           c.Title.ToLower().Contains(q))
                .Take(limit)
                .Select(c => new GlobalSearchDto { Id = c.Id.ToString(), Title = c.Title, Subtitle = c.Customer != null ? c.Customer.CompanyName : "Contract", Type = "Contract", Path = "/contracts" })
                .ToListAsync();
            results.AddRange(contracts);

            // Assets
            var assets = await _context.Assets
                .Where(a => a.TenantId == tenantId && !a.IsDeleted &&
                           (a.Name.ToLower().Contains(q) || a.SerialNumber.ToLower().Contains(q) || a.Brand.ToLower().Contains(q) || a.Model.ToLower().Contains(q)))
                .Take(limit)
                .Select(a => new GlobalSearchDto { Id = a.Id.ToString(), Title = a.Name, Subtitle = $"{a.Brand} {a.Model} | S/N: {a.SerialNumber}", Type = "Asset", Path = "/assets" })
                .ToListAsync();
            results.AddRange(assets);

            // ─── Work Orders ──────────────────────────────────────────────
            var workOrders = await _context.WorkOrders
                .Where(w => w.TenantId == tenantId && !w.IsDeleted &&
                           (w.JobNumber.ToLower().Contains(q) || w.Description.ToLower().Contains(q)))
                .Take(limit)
                .Select(w => new GlobalSearchDto { Id = w.Id.ToString(), Title = w.JobNumber ?? $"WO-{w.Id}", Subtitle = w.Description, Type = "Work Order", Path = $"/job/{w.Id}" })
                .ToListAsync();
            results.AddRange(workOrders);

            // ─── Quotations ───────────────────────────────────────────────
            var quotes = await _context.Quotations
                .Include(qt => qt.Customer)
                .Where(qt => qt.TenantId == tenantId &&
                            (qt.QuoteNumber.ToLower().Contains(q) || qt.Notes.ToLower().Contains(q)))
                .Take(limit)
                .Select(qt => new GlobalSearchDto { Id = qt.Id.ToString(), Title = qt.QuoteNumber, Subtitle = qt.Customer != null ? qt.Customer.CompanyName : "Quotation", Type = "Quotation", Path = $"/quotations/edit/{qt.Id}" })
                .ToListAsync();
            results.AddRange(quotes);

            // ─── Finance ──────────────────────────────────────────────────
            // Invoices
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .Where(i => i.TenantId == tenantId && !i.IsDeleted &&
                           i.InvoiceNumber.ToLower().Contains(q))
                .Take(limit)
                .Select(i => new GlobalSearchDto { Id = i.Id.ToString(), Title = i.InvoiceNumber, Subtitle = i.Customer != null ? i.Customer.CompanyName : "Invoice", Type = "Invoice", Path = "/invoices" })
                .ToListAsync();
            results.AddRange(invoices);

            // ─── Inventory ────────────────────────────────────────────────
            // Products
            var products = await _context.Products
                .Where(p => p.TenantId == tenantId &&
                           p.Name.ToLower().Contains(q))
                .Take(limit)
                .Select(p => new GlobalSearchDto { Id = p.Id.ToString(), Title = p.Name, Subtitle = p.Category != null ? p.Category.Name : "Product", Type = "Product", Path = "/products" })
                .ToListAsync();
            results.AddRange(products);

            // Warehouses
            var warehouses = await _context.Warehouses
                .Where(w => w.TenantId == tenantId && !w.IsDeleted &&
                           (w.Name.ToLower().Contains(q) || w.Location.ToLower().Contains(q)))
                .Take(limit)
                .Select(w => new GlobalSearchDto { Id = w.Id.ToString(), Title = w.Name, Subtitle = w.Location, Type = "Warehouse", Path = "/procurement" })
                .ToListAsync();
            results.AddRange(warehouses);

            // Vendors
            var vendors = await _context.Vendors
                .Where(v => v.TenantId == tenantId && !v.IsDeleted &&
                           (v.Name.ToLower().Contains(q) || v.Email.ToLower().Contains(q) || v.ContactPerson.ToLower().Contains(q)))
                .Take(limit)
                .Select(v => new GlobalSearchDto { Id = v.Id.ToString(), Title = v.Name, Subtitle = v.ContactPerson, Type = "Vendor", Path = "/procurement" })
                .ToListAsync();
            results.AddRange(vendors);

            // Purchase Orders
            var purchaseOrders = await _context.PurchaseOrders
                .Include(po => po.Vendor)
                .Where(po => po.TenantId == tenantId &&
                            po.PONumber.ToLower().Contains(q))
                .Take(limit)
                .Select(po => new GlobalSearchDto { Id = po.Id.ToString(), Title = po.PONumber, Subtitle = po.Vendor != null ? po.Vendor.Name : "Purchase Order", Type = "Purchase Order", Path = "/procurement" })
                .ToListAsync();
            results.AddRange(purchaseOrders);

            // Categories
            var categories = await _context.Categories
                .Where(c => c.TenantId == tenantId &&
                           (c.Name.ToLower().Contains(q) || (c.Description != null && c.Description.ToLower().Contains(q))))
                .Take(limit)
                .Select(c => new GlobalSearchDto { Id = c.Id.ToString(), Title = c.Name, Subtitle = c.Description ?? "Category", Type = "Category", Path = "/categories" })
                .ToListAsync();
            results.AddRange(categories);

            // ─── Team Members / Users ─────────────────────────────────────
            var users = await _context.Users
                .Where(u => u.TenantId == tenantId &&
                           (u.FullName.ToLower().Contains(q) || u.Email.ToLower().Contains(q)))
                .Take(limit)
                .Select(u => new GlobalSearchDto { Id = u.Id, Title = u.FullName ?? u.Email ?? "User", Subtitle = u.Email ?? "", Type = "Team Member", Path = "/users" })
                .ToListAsync();
            results.AddRange(users);

            return Ok(results);
        }
    }
}
