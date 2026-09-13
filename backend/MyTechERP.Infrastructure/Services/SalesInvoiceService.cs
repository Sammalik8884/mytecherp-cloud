using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.SalesInvoices;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.sales;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class SalesInvoiceService : ISalesInvoiceService
    {
        private readonly ApplicationDbContext _context;
        private readonly ISalesInvoicePdfService _pdfService;

        public SalesInvoiceService(ApplicationDbContext context, ISalesInvoicePdfService pdfService)
        {
            _context = context;
            _pdfService = pdfService;
        }

        public async Task<SalesInvoiceDto> CreateInvoiceAsync(CreateSalesInvoiceDto dto, string userId)
        {
            var invoice = new SalesInvoice
            {
                InvoiceNumber = dto.InvoiceNumber,
                InvoiceDate = dto.InvoiceDate,
                CustomerName = dto.CustomerName,
                ContactPerson = dto.ContactPerson,
                SiteName = dto.SiteName,
                SiteNtn = dto.SiteNtn,
                ProjectName = dto.ProjectName,
                ScopeOfWork = dto.ScopeOfWork,
                PoRef = dto.PoRef,
                SesRef = dto.SesRef,
                MyTechNtnRef = dto.MyTechNtnRef,
                SubTotal = dto.SubTotal,
                GstPercentage = dto.GstPercentage,
                GstAmount = dto.GstAmount,
                GrandTotal = dto.GrandTotal,
                AmountInWords = dto.AmountInWords,
                CreatedByUserId = userId,
                Items = dto.Items.Select(i => new SalesInvoiceItem
                {
                    SNo = i.SNo,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    Unit = i.Unit,
                    Rate = i.Rate,
                    Amount = i.Amount
                }).ToList()
            };

            _context.SalesInvoices.Add(invoice);
            await _context.SaveChangesAsync();

            return await GetInvoiceByIdAsync(invoice.Id);
        }

        public async Task<SalesInvoiceDto> GetInvoiceByIdAsync(int id)
        {
            var invoice = await _context.SalesInvoices
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (invoice == null) throw new Exception("Invoice not found.");

            return MapToDto(invoice);
        }

        public async Task<IEnumerable<SalesInvoiceDto>> GetAllInvoicesAsync()
        {
            var invoices = await _context.SalesInvoices
                .Include(x => x.Items)
                .Where(x => !x.IsDeleted)
                .OrderByDescending(x => x.InvoiceDate)
                .ToListAsync();

            return invoices.Select(MapToDto);
        }

        public async Task DeleteInvoiceAsync(int id)
        {
            var invoice = await _context.SalesInvoices.FindAsync(id);
            if (invoice != null)
            {
                invoice.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<byte[]> GeneratePdfAsync(int id)
        {
            var dto = await GetInvoiceByIdAsync(id);
            return _pdfService.GeneratePdf(dto);
        }

        private SalesInvoiceDto MapToDto(SalesInvoice invoice)
        {
            return new SalesInvoiceDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                InvoiceDate = invoice.InvoiceDate,
                CustomerName = invoice.CustomerName,
                ContactPerson = invoice.ContactPerson,
                SiteName = invoice.SiteName,
                SiteNtn = invoice.SiteNtn,
                ProjectName = invoice.ProjectName,
                ScopeOfWork = invoice.ScopeOfWork,
                PoRef = invoice.PoRef,
                SesRef = invoice.SesRef,
                MyTechNtnRef = invoice.MyTechNtnRef,
                SubTotal = invoice.SubTotal,
                GstPercentage = invoice.GstPercentage,
                GstAmount = invoice.GstAmount,
                GrandTotal = invoice.GrandTotal,
                AmountInWords = invoice.AmountInWords,
                CreatedByUserId = invoice.CreatedByUserId,
                Items = invoice.Items.Where(i => !i.IsDeleted).OrderBy(i => i.SNo).Select(i => new SalesInvoiceItemDto
                {
                    Id = i.Id,
                    SNo = i.SNo,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    Unit = i.Unit,
                    Rate = i.Rate,
                    Amount = i.Amount
                }).ToList()
            };
        }
    }
}
