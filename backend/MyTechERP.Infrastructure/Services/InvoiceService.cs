using Microsoft.EntityFrameworkCore;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.Finance;
using MytechERP.domain.Enums;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.Finance;

namespace MyTechERP.Infrastructure.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly ApplicationDbContext _context;
        private readonly ITimeTrackingService _timeService; 

        public InvoiceService(ApplicationDbContext context , ITimeTrackingService timeTrackingService)
        {
            _timeService = timeTrackingService;
            _context = context;
        }

        public async Task<Invoice> CreateFromQuotationAsync(int quotationId)
        {
            var quote = await _context.Quotations
                .Include(q => q.Items)
                .Include(q => q.Customer)
                .FirstOrDefaultAsync(q => q.Id == quotationId);

            if (quote == null) throw new KeyNotFoundException("Quotation not found");

            if (quote.Status != QuotationStatus.Approved)
                throw new InvalidOperationException("Cannot invoice a quotation that is not Approved.");

            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMM}-{quote.Id}",
                CustomerId = quote.CustomerId,
                QuotationId = quote.Id,
                IssueDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                SubTotal = quote.SubTotal,
                TaxAmount = quote.GSTAmount + quote.IncomeTaxAmount,
                TotalAmount = quote.GrandTotal,
                Status = InvoiceStatus.Draft,
                TenantId = quote.TenantId 
            };

            
            foreach (var item in quote.Items)
            {
                invoice.Items.Add(new InvoiceItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TenantId = quote.TenantId
                });
            }

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            return invoice;
        }
        public async Task<InvoiceDto> CreateCustomInvoiceAsync(CreateInvoiceDto dto, string tenantId)
        {
            int tId = int.Parse(tenantId);
            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
                CustomerId = dto.CustomerId,
                QuotationId = dto.QuotationId,
                WorkOrderId = dto.WorkOrderId,
                IssueDate = dto.IssueDate,
                DueDate = dto.DueDate,
                SubTotal = dto.SubTotal,
                TaxAmount = dto.TaxAmount,
                TotalAmount = dto.TotalAmount,
                Status = (InvoiceStatus)dto.Status,
                TenantId = tId
            };

            foreach (var item in dto.Items)
            {
                invoice.Items.Add(new InvoiceItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice,
                    TenantId = tId
                });
            }

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(invoice.Id, tenantId);
        }

        public async Task<int> GenerateInvoiceFromJobAsync(int workOrderId)
        {
            var job = await _context.WorkOrders.FindAsync(workOrderId);
            if (job == null) throw new Exception("Work Order not found.");

            decimal laborCost = await _timeService.CalculateJobLaborCostAsync(workOrderId, 85.00m);

            var invoice = new Invoice
            {
                CustomerId = job.CustomerId,
                WorkOrderId = workOrderId,
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
                IssueDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                Status = InvoiceStatus.Issued, 
                AmountPaid = 0
            };

            decimal runningSubTotal = 0;

            if (laborCost > 0)
            {
                invoice.Items.Add(new InvoiceItem
                {
                    Description = "Technician Labor (Time tracked)",
                    Quantity = 1,
                    UnitPrice = laborCost,
                    TotalPrice = laborCost 
                });

                runningSubTotal += laborCost;
            }

            
            invoice.SubTotal = runningSubTotal;
            invoice.TaxAmount = runningSubTotal * 0.10m;

            invoice.TotalAmount = invoice.SubTotal + invoice.TaxAmount;

            _context.Invoices.Add(invoice);

            job.Status = WorkOrderStatus.Completed;

            await _context.SaveChangesAsync();
            return invoice.Id;
        }

        public async Task<IEnumerable<InvoiceDto>> GetAllAsync(string tenantId)
        {
            int tId = int.Parse(tenantId);
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .Where(i => i.TenantId == tId)
                .OrderByDescending(i => i.Id)
                .ToListAsync();

            return invoices.Select(i => new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerId = i.CustomerId,
                CustomerName = i.Customer != null ? i.Customer.Name : "Unknown",
                QuotationId = i.QuotationId,
                WorkOrderId = i.WorkOrderId,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate,
                SubTotal = i.SubTotal,
                TaxAmount = i.TaxAmount,
                TotalAmount = i.TotalAmount,
                AmountPaid = i.AmountPaid,
                Status = (int)i.Status,
                StatusString = i.Status.ToString()
            });
        }

        public async Task<InvoiceDto> GetByIdAsync(int id, string tenantId)
        {
            int tId = int.Parse(tenantId);
            var i = await _context.Invoices
                .Include(invoice => invoice.Customer)
                .Include(invoice => invoice.Items)
                .FirstOrDefaultAsync(invoice => invoice.Id == id && invoice.TenantId == tId);

            if (i == null) throw new KeyNotFoundException("Invoice not found");

            return new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerId = i.CustomerId,
                CustomerName = i.Customer != null ? i.Customer.Name : "Unknown",
                QuotationId = i.QuotationId,
                WorkOrderId = i.WorkOrderId,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate,
                SubTotal = i.SubTotal,
                TaxAmount = i.TaxAmount,
                TotalAmount = i.TotalAmount,
                AmountPaid = i.AmountPaid,
                Status = (int)i.Status,
                StatusString = i.Status.ToString(),
                Items = i.Items.Select(item => new InvoiceItemDto
                {
                    Id = item.Id,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice > 0 ? item.TotalPrice : (item.Quantity * item.UnitPrice)
                }).ToList()
            };
        }

        public async Task<bool> UpdateStatusAsync(int id, int status, string tenantId)
        {
            int tId = int.Parse(tenantId);
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tId);
            if (invoice == null) return false;

            invoice.Status = (InvoiceStatus)status;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<InvoiceDto>> GetByCustomerEmailAsync(string email)
        {
            // Find the customer whose email matches the logged-in user
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Email.ToLower() == email.ToLower());

            if (customer == null) return Enumerable.Empty<InvoiceDto>();

            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .Where(i => i.CustomerId == customer.Id)
                .OrderByDescending(i => i.Id)
                .ToListAsync();

            return invoices.Select(i => new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerId = i.CustomerId,
                CustomerName = i.Customer != null ? i.Customer.Name : "Unknown",
                QuotationId = i.QuotationId,
                WorkOrderId = i.WorkOrderId,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate,
                SubTotal = i.SubTotal,
                TaxAmount = i.TaxAmount,
                TotalAmount = i.TotalAmount,
                AmountPaid = i.AmountPaid,
                Status = (int)i.Status,
                StatusString = i.Status.ToString(),
                Items = i.Items.Select(item => new InvoiceItemDto
                {
                    Id = item.Id,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice > 0 ? item.TotalPrice : (item.Quantity * item.UnitPrice)
                }).ToList()
            });
        }
    }
}

