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

        private async Task<string> GenerateNextInvoiceNumberAsync(int tenantId)
        {
            var maxInvoice = await _context.Invoices
                .Where(i => i.TenantId == tenantId && i.InvoiceNumber.StartsWith("MTI-A"))
                .OrderByDescending(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (maxInvoice != null)
            {
                var numStr = maxInvoice.InvoiceNumber.Replace("MTI-A", "");
                if (int.TryParse(numStr, out int lastNum))
                {
                    nextNumber = lastNum + 1;
                }
            }
            return $"MTI-A{nextNumber:D4}";
        }

        public async Task<Invoice> CreateFromQuotationAsync(int quotationId)
        {
            var quote = await _context.Quotations
                .Include(q => q.Items)
                .Include(q => q.Customer)
                .FirstOrDefaultAsync(q => q.Id == quotationId);

            if (quote == null) throw new KeyNotFoundException("Quotation not found");

            if (quote.Status != QuotationStatus.Approved && quote.Status != QuotationStatus.SentToCustomer && quote.Status != QuotationStatus.Converted)
                throw new InvalidOperationException("Cannot invoice a quotation that is not Approved or SentToCustomer.");

            // Load default bank account for this tenant to populate bank details in PDF
            var defaultBank = await _context.BankAccounts
                .Where(b => b.TenantId == quote.TenantId && b.IsDefault && !b.IsDeleted)
                .FirstOrDefaultAsync();

            var invoice = new Invoice
            {
                InvoiceNumber = await GenerateNextInvoiceNumberAsync(quote.TenantId),
                CustomerId = quote.CustomerId,
                QuotationId = quote.Id,
                IssueDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                SubTotal = quote.SubTotal,
                TaxAmount = quote.GSTAmount + quote.IncomeTaxAmount,
                TotalAmount = quote.GrandTotal,
                Status = InvoiceStatus.Draft,
                TenantId = quote.TenantId,
                // Auto-populate bank details from default bank account
                BankName = defaultBank?.BankName,
                BankAccountTitle = defaultBank?.AccountTitle,
                BankAccountNumber = defaultBank?.AccountNumber
            };

            foreach (var item in quote.Items)
            {
                invoice.Items.Add(new InvoiceItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice,
                    TenantId = quote.TenantId
                });
            }

            _context.Invoices.Add(invoice);
            
            // Mark the quotation as converted so we can track it
            quote.Status = QuotationStatus.Converted;
            
            await _context.SaveChangesAsync();
            return invoice;
        }
        public async Task<InvoiceDto> CreateCustomInvoiceAsync(CreateInvoiceDto dto, string tenantId)
        {
            int tId = int.Parse(tenantId);
            var invoice = new Invoice
            {
                InvoiceNumber = await GenerateNextInvoiceNumberAsync(tId),
                CustomerId = dto.CustomerId,
                QuotationId = dto.QuotationId,
                WorkOrderId = dto.WorkOrderId,
                IssueDate = dto.IssueDate,
                DueDate = dto.DueDate,
                SubTotal = dto.SubTotal,
                TaxAmount = dto.TaxAmount,
                TotalAmount = dto.TotalAmount,
                Status = (InvoiceStatus)dto.Status,
                TenantId = tId,
                BankName = dto.BankName,
                BankAccountNumber = dto.BankAccountNumber,
                BankAccountTitle = dto.BankAccountTitle,
                IssuedByName = dto.IssuedByName,
                IssuedByPhone = dto.IssuedByPhone
            };

            foreach (var item in dto.Items)
            {
                invoice.Items.Add(new InvoiceItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    QuotationItemId = item.QuotationItemId, // Add this
                    TotalPrice = item.Quantity * item.UnitPrice,
                    TenantId = tId
                });
            }

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // Check if quotation is fully invoiced and update status
            if (dto.QuotationId.HasValue && dto.QuotationId.Value > 0)
            {
                var quote = await _context.Quotations
                    .Include(q => q.Items)
                    .FirstOrDefaultAsync(q => q.Id == dto.QuotationId.Value);
                    
                if (quote != null)
                {
                    var invoicedQuantities = await _context.Invoices
                        .Where(i => i.QuotationId == quote.Id && i.Status != InvoiceStatus.Cancelled)
                        .SelectMany(i => i.Items)
                        .Where(i => i.QuotationItemId != null)
                        .GroupBy(i => i.QuotationItemId.Value)
                        .Select(g => new { QuotationItemId = g.Key, InvoicedQty = g.Sum(x => x.Quantity) })
                        .ToDictionaryAsync(x => x.QuotationItemId, x => x.InvoicedQty);

                    bool isFullyInvoiced = true;
                    if (quote.Items.Any())
                    {
                        foreach (var item in quote.Items)
                        {
                            decimal iQty = invoicedQuantities.ContainsKey(item.Id) ? invoicedQuantities[item.Id] : 0;
                            if (iQty < item.Quantity)
                            {
                                isFullyInvoiced = false;
                                break;
                            }
                        }
                    }
                    else
                    {
                        isFullyInvoiced = false;
                    }

                    if (isFullyInvoiced && quote.Status != QuotationStatus.Converted)
                    {
                        quote.Status = QuotationStatus.Converted;
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return await GetByIdAsync(invoice.Id, tenantId);
        }

        public async Task<InvoiceDto> UpdateCustomInvoiceAsync(int id, CreateInvoiceDto dto, string tenantId)
        {
            int tid = int.Parse(tenantId);
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tid);

            if (invoice == null)
                throw new Exception("Invoice not found.");

            if (invoice.Status != InvoiceStatus.Draft)
                throw new Exception("Only Draft invoices can be edited.");

            invoice.IssueDate = dto.IssueDate;
            invoice.DueDate = dto.DueDate;
            invoice.SubTotal = dto.SubTotal;
            invoice.TaxAmount = dto.TaxAmount;
            invoice.TotalAmount = dto.TotalAmount;
            
            invoice.BankName = dto.BankName;
            invoice.BankAccountNumber = dto.BankAccountNumber;
            invoice.BankAccountTitle = dto.BankAccountTitle;
            invoice.IssuedByName = dto.IssuedByName;
            invoice.IssuedByPhone = dto.IssuedByPhone;

            // Simple update for items: remove existing and add new
            _context.InvoiceItems.RemoveRange(invoice.Items);
            
            foreach (var item in dto.Items)
            {
                invoice.Items.Add(new InvoiceItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    QuotationItemId = item.QuotationItemId,
                    TotalPrice = item.Quantity * item.UnitPrice,
                    TenantId = tid
                });
            }

            await _context.SaveChangesAsync();

            // Check if quotation is fully invoiced and update status
            if (dto.QuotationId.HasValue && dto.QuotationId.Value > 0)
            {
                var quote = await _context.Quotations
                    .Include(q => q.Items)
                    .FirstOrDefaultAsync(q => q.Id == dto.QuotationId.Value);
                    
                if (quote != null)
                {
                    var invoicedQuantities = await _context.Invoices
                        .Where(i => i.QuotationId == quote.Id && i.Status != InvoiceStatus.Cancelled)
                        .SelectMany(i => i.Items)
                        .Where(i => i.QuotationItemId != null)
                        .GroupBy(i => i.QuotationItemId.Value)
                        .Select(g => new { QuotationItemId = g.Key, InvoicedQty = g.Sum(x => x.Quantity) })
                        .ToDictionaryAsync(x => x.QuotationItemId, x => x.InvoicedQty);

                    bool isFullyInvoiced = true;
                    if (quote.Items.Any())
                    {
                        foreach (var item in quote.Items)
                        {
                            decimal iQty = invoicedQuantities.ContainsKey(item.Id) ? invoicedQuantities[item.Id] : 0;
                            if (iQty < item.Quantity)
                            {
                                isFullyInvoiced = false;
                                break;
                            }
                        }
                    }
                    else
                    {
                        isFullyInvoiced = false;
                    }

                    if (isFullyInvoiced && quote.Status != QuotationStatus.Converted)
                    {
                        quote.Status = QuotationStatus.Converted;
                        await _context.SaveChangesAsync();
                    }
                    else if (!isFullyInvoiced && quote.Status == QuotationStatus.Converted)
                    {
                        // Revert if no longer fully invoiced due to edit
                        quote.Status = QuotationStatus.Approved;
                        await _context.SaveChangesAsync();
                    }
                }
            }

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
                InvoiceNumber = await GenerateNextInvoiceNumberAsync(job.TenantId),
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
                BankName = i.BankName,
                BankAccountNumber = i.BankAccountNumber,
                BankAccountTitle = i.BankAccountTitle,
                IssuedByName = i.IssuedByName,
                IssuedByPhone = i.IssuedByPhone,
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
        public async Task<IEnumerable<BankAccountDto>> GetBankAccountsAsync(string tenantId)
        {
            int tId = int.Parse(tenantId);
            var accounts = await _context.BankAccounts
                .Where(b => b.TenantId == tId && !b.IsDeleted)
                .ToListAsync();

            return accounts.Select(b => new BankAccountDto
            {
                Id = b.Id,
                BankName = b.BankName,
                AccountNumber = b.AccountNumber,
                AccountTitle = b.AccountTitle,
                IsDefault = b.IsDefault
            });
        }

        public async Task<BankAccountDto> AddBankAccountAsync(BankAccountDto dto, string tenantId)
        {
            int tId = int.Parse(tenantId);
            var bank = new BankAccount
            {
                BankName = dto.BankName,
                AccountNumber = dto.AccountNumber,
                AccountTitle = dto.AccountTitle,
                IsDefault = dto.IsDefault,
                TenantId = tId
            };
            _context.BankAccounts.Add(bank);
            await _context.SaveChangesAsync();
            
            dto.Id = bank.Id;
            return dto;
        }
    }
}

