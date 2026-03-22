using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.Finance;
using MytechERP.domain.Quotations;
using MytechERP.domain.Inventory;
using MytechERP.domain.Enums;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SeederController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public SeederController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpPost("run")]
        public async Task<IActionResult> Run()
        {
            try
            {
                var rand = new Random();
                var tenantId = _db.Tenants.FirstOrDefault()?.Id;
                if (tenantId == null) return BadRequest("No tenant found");

                // Generate Customers
                var customers = new[] {
                    new Customer { CompanyName = "Acme Corp", Name = "Acme Corp", Email = "contact@acme.com", TenantId = tenantId.Value, Phone = "555-0100", Address = "123 Main St" },
                    new Customer { CompanyName = "Global Tech", Name = "Global Tech", Email = "hello@globaltech.com", TenantId = tenantId.Value, Phone = "555-0200", Address = "456 Oak Ave" },
                    new Customer { CompanyName = "StartUp Inc", Name = "StartUp Inc", Email = "info@startup.com", TenantId = tenantId.Value, Phone = "555-0300", Address = "789 Pine Blvd" },
                    new Customer { CompanyName = "Omega Solutions", Name = "Omega Solutions", Email = "billing@omega.com", TenantId = tenantId.Value, Phone = "555-0400", Address = "101 Cyber Way" },
                    new Customer { CompanyName = "Zenith Logistics", Name = "Zenith Logistics", Email = "ops@zenith.com", TenantId = tenantId.Value, Phone = "555-0500", Address = "202 Route 9" }
                };

                foreach (var c in customers)
                {
                    if (!_db.Customers.Any(x => x.CompanyName == c.CompanyName)) _db.Customers.Add(c);
                }
                await _db.SaveChangesAsync();

                var customerList = _db.Customers.ToList();

                // Generate Quotations
                QuotationStatus[] quoteStatuses = { QuotationStatus.Draft, QuotationStatus.SentToCustomer, QuotationStatus.Approved, QuotationStatus.Rejected };
                for (int i = 0; i < 40; i++)
                {
                    var c = customerList[rand.Next(customerList.Count)];
                    var q = new Quotation
                    {
                        QuoteNumber = $"QT-{DateTime.Now.Year}-{rand.Next(1000, 9999)}",
                        CustomerId = c.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-rand.Next(0, 180)),
                        IssueDate = DateTime.UtcNow.AddDays(-rand.Next(0, 180)),
                        ValidUntil = DateTime.UtcNow.AddDays(rand.Next(10, 30)),
                        Status = quoteStatuses[rand.Next(quoteStatuses.Length)],
                        GrandTotal = rand.Next(1000, 50000),
                        TenantId = tenantId.Value,
                        Currency = "USD"
                    };
                    _db.Quotations.Add(q);
                }

                // Generate Invoices
                for (int i = 0; i < 60; i++)
                {
                    var c = customerList[rand.Next(customerList.Count)];
                    var issueDate = DateTime.UtcNow.AddDays(-rand.Next(0, 180));
                    int randStat = rand.Next(100);
                    InvoiceStatus status = randStat > 30 ? InvoiceStatus.Paid : (randStat > 50 ? InvoiceStatus.Issued : InvoiceStatus.Overdue);
                    var amount = rand.Next(500, 20000);
                    
                    var inv = new Invoice
                    {
                        InvoiceNumber = $"INV-{DateTime.Now.Year}-{rand.Next(1000, 9999)}",
                        CustomerId = c.Id,
                        IssueDate = issueDate,
                        DueDate = issueDate.AddDays(30),
                        Status = status,
                        TotalAmount = amount,
                        AmountPaid = status == InvoiceStatus.Paid ? amount : (status == InvoiceStatus.Issued ? rand.Next(0, amount/2) : 0),
                        TenantId = tenantId.Value
                    };
                    _db.Invoices.Add(inv);
                }

                // Generate WorkOrders
                WorkOrderStatus[] woStatuses = { WorkOrderStatus.Created, WorkOrderStatus.Assigned, WorkOrderStatus.Initialized, WorkOrderStatus.InProgress, WorkOrderStatus.PendingApproval, WorkOrderStatus.Approved, WorkOrderStatus.Completed, WorkOrderStatus.Completed, WorkOrderStatus.Completed };
                for (int i = 0; i < 50; i++)
                {
                    var c = customerList[rand.Next(customerList.Count)];
                    var status = woStatuses[rand.Next(woStatuses.Length)];
                    var isCompleted = status == WorkOrderStatus.Completed;
                    var wo = new WorkOrder
                    {
                        Description = $"Routine maintenance and inspection job #{rand.Next(100, 999)}",
                        CustomerId = c.Id,
                        Status = status,
                        ScheduledDate = DateTime.UtcNow.AddDays(rand.Next(-90, 30)),
                        CompletedDate = isCompleted ? DateTime.UtcNow.AddDays(-rand.Next(0, 90)) : null,
                        TenantId = tenantId.Value
                    };
                    _db.WorkOrders.Add(wo);
                }

                await _db.SaveChangesAsync();
                return Ok(new { message = "Dummy data seeded successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
