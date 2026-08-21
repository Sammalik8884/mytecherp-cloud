using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Quotations;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Quotations;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class SupplyQuotationService : ISupplyQuotationService
    {
        private readonly ApplicationDbContext _context;
        private readonly SupplyQuotationPdfService _pdfService;
        private readonly SupplyQuotationExcelService _excelService;

        public SupplyQuotationService(
            ApplicationDbContext context,
            SupplyQuotationPdfService pdfService,
            SupplyQuotationExcelService excelService)
        {
            _context = context;
            _pdfService = pdfService;
            _excelService = excelService;
        }

        public async Task<SupplyQuotationDto> GetSupplyQuotationByIdAsync(int id)
        {
            var quote = await _context.SupplyQuotations
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quote == null) throw new Exception("Quotation not found");

            return MapToDto(quote);
        }

        public async Task<List<SupplyQuotationDto>> GetAllSupplyQuotationsAsync()
        {
            var quotes = await _context.SupplyQuotations
                .OrderByDescending(q => q.Id)
                .ToListAsync();

            return quotes.Select(q => MapToDto(q)).ToList();
        }

        public async Task<SupplyQuotationDto> CreateSupplyQuotationAsync(CreateSupplyQuotationDto dto, string userId)
        {
            var nextId = (await _context.SupplyQuotations.MaxAsync(q => (int?)q.Id) ?? 0) + 1;
            var companyPrefix = string.IsNullOrWhiteSpace(dto.HeaderCompany) 
                ? "CORP" 
                : dto.HeaderCompany.ToUpper().Trim().Replace(" ", "-");
            
            var quoteNumber = $"MTQ-{companyPrefix}-AA{nextId:D4}";

            var quote = new SupplyQuotation
            {
                QuoteNumber = quoteNumber,
                QuoteDate = dto.QuoteDate,
                QuotationFor = dto.QuotationFor,
                RevisionNumber = dto.RevisionNumber,
                HeaderToName = dto.HeaderToName,
                HeaderDesignation = dto.HeaderDesignation,
                HeaderCompany = dto.HeaderCompany,
                HeaderLocation = dto.HeaderLocation,
                TermsAndConditionsJson = dto.TermsAndConditionsJson,
                CreatedByUserId = userId,
                SupplyColumnsJson = JsonSerializer.Serialize(dto.SupplyColumns),
                TaxPercentage = dto.TaxPercentage,
                TaxAmount = dto.TaxAmount,
                NetTotal = dto.NetTotal,
                GrandTotal = dto.GrandTotal,
                ApprovedBy = dto.ApprovedBy,
                IssuedBy = dto.IssuedBy,
                Items = dto.Items.Select(i => new SupplyQuotationItem
                {
                    SNo = i.SNo,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    Unit = i.Unit,
                    RatesJson = JsonSerializer.Serialize(i.Rates),
                    TotalAmount = i.TotalAmount
                }).ToList()
            };

            _context.SupplyQuotations.Add(quote);
            await _context.SaveChangesAsync();

            return await GetSupplyQuotationByIdAsync(quote.Id);
        }

        public async Task<SupplyQuotationDto> UpdateSupplyQuotationAsync(int id, CreateSupplyQuotationDto dto)
        {
            var quote = await _context.SupplyQuotations
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quote == null) throw new Exception("Quotation not found");

            quote.QuoteDate = dto.QuoteDate;
            quote.QuotationFor = dto.QuotationFor;
            quote.RevisionNumber = dto.RevisionNumber;
            quote.HeaderToName = dto.HeaderToName;
            quote.HeaderDesignation = dto.HeaderDesignation;
            quote.HeaderCompany = dto.HeaderCompany;
            quote.HeaderLocation = dto.HeaderLocation;
            quote.TermsAndConditionsJson = dto.TermsAndConditionsJson;
            quote.SupplyColumnsJson = JsonSerializer.Serialize(dto.SupplyColumns);
            quote.TaxPercentage = dto.TaxPercentage;
            quote.TaxAmount = dto.TaxAmount;
            quote.NetTotal = dto.NetTotal;
            quote.GrandTotal = dto.GrandTotal;
            quote.ApprovedBy = dto.ApprovedBy;
            quote.IssuedBy = dto.IssuedBy;

            var companyPrefix = string.IsNullOrWhiteSpace(dto.HeaderCompany) 
                ? "CORP" 
                : dto.HeaderCompany.ToUpper().Trim().Replace(" ", "-");

            // Extract the serial part from existing quote number, e.g. MTQ-EPCL-AA0003 -> 0003
            var parts = quote.QuoteNumber.Split(new[] { "-AA" }, StringSplitOptions.None);
            string serialPart = parts.Length > 1 ? parts[1] : quote.Id.ToString("D4");
            
            quote.QuoteNumber = $"MTQ-{companyPrefix}-AA{serialPart}";

            _context.SupplyQuotationItems.RemoveRange(quote.Items);
            
            quote.Items = dto.Items.Select(i => new SupplyQuotationItem
            {
                SupplyQuotationId = id,
                SNo = i.SNo,
                Description = i.Description,
                Quantity = i.Quantity,
                Unit = i.Unit,
                RatesJson = JsonSerializer.Serialize(i.Rates),
                TotalAmount = i.TotalAmount
            }).ToList();

            await _context.SaveChangesAsync();
            return await GetSupplyQuotationByIdAsync(id);
        }

        public async Task DeleteSupplyQuotationAsync(int id)
        {
            var quote = await _context.SupplyQuotations.FindAsync(id);
            if (quote != null)
            {
                _context.SupplyQuotations.Remove(quote);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<byte[]> GeneratePdfAsync(int id)
        {
            var dto = await GetSupplyQuotationByIdAsync(id);
            return _pdfService.GeneratePdf(dto);
        }

        public async Task<byte[]> GenerateExcelAsync(int id)
        {
            var dto = await GetSupplyQuotationByIdAsync(id);
            return _excelService.GenerateExcel(dto);
        }

        private SupplyQuotationDto MapToDto(SupplyQuotation quote)
        {
            return new SupplyQuotationDto
            {
                Id = quote.Id,
                QuoteNumber = quote.QuoteNumber,
                QuoteDate = quote.QuoteDate,
                QuotationFor = quote.QuotationFor,
                RevisionNumber = quote.RevisionNumber,
                HeaderToName = quote.HeaderToName,
                HeaderDesignation = quote.HeaderDesignation,
                HeaderCompany = quote.HeaderCompany,
                HeaderLocation = quote.HeaderLocation,
                TermsAndConditionsJson = quote.TermsAndConditionsJson,
                CreatedByUserId = quote.CreatedByUserId,
                SupplyColumnsJson = quote.SupplyColumnsJson,
                TaxPercentage = quote.TaxPercentage,
                TaxAmount = quote.TaxAmount,
                NetTotal = quote.NetTotal,
                GrandTotal = quote.GrandTotal,
                ApprovedBy = quote.ApprovedBy,
                IssuedBy = quote.IssuedBy,
                Items = quote.Items?.Select(i => new SupplyQuotationItemDto
                {
                    Id = i.Id,
                    SupplyQuotationId = i.SupplyQuotationId,
                    SNo = i.SNo,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    Unit = i.Unit,
                    RatesJson = i.RatesJson,
                    TotalAmount = i.TotalAmount
                }).ToList() ?? new List<SupplyQuotationItemDto>()
            };
        }
    }
}
