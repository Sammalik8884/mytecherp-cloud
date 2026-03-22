using Microsoft.EntityFrameworkCore;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Enums;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class QuotationConversionService : IQuotationConversionService
    {
        private readonly ApplicationDbContext _context;
        ICurrentUserService _currentUserService;

        public QuotationConversionService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<int> ConvertToWorkOrderAsync(int quotationId)
        {
            var quote = await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Site)
                .FirstOrDefaultAsync(q => q.Id == quotationId);

            if (quote == null)
                throw new KeyNotFoundException("Quotation not found");

            if (quote.Status != QuotationStatus.Approved && quote.Status != QuotationStatus.SentToCustomer && quote.Status != QuotationStatus.Converted)
                throw new InvalidOperationException(
                    $"Cannot convert Quote. Status must be 'Approved' or 'SentToCustomer', but it is '{quote.Status}'.");
            var existingWorkOrder = await _context.WorkOrders.AnyAsync(w => w.ReferenceQuotationId == quotationId);
            if (existingWorkOrder)
                throw new InvalidOperationException("A Work Order has already been created for this Quotation.");
            var workOrder = new WorkOrder
            {
                Description = $"WO from Quote #{quote.QuoteNumber} - {quote.Customer?.Name ?? "Unknown"}",
                Status = WorkOrderStatus.Created,
                ScheduledDate = DateTime.Now.AddDays(3),
                CustomerId = quote.CustomerId,
                SiteId = quote.SiteId,
                ReferenceQuotationId = quote.Id,
                TenantId = quote.TenantId,
                AssetId=quote.AssetId,
                JobNumber = $"WO-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}"
            };

            quote.Status = QuotationStatus.Converted;

            _context.WorkOrders.Add(workOrder);
            await _context.SaveChangesAsync();

            return workOrder.Id;
        }
        public async Task<int> ConvertToContractAsync(int quotationId, DateTime startDate, int monthsDuration)
        {
            var quote = await _context.Quotations.FindAsync(quotationId);

            if (quote == null) throw new KeyNotFoundException("Quotation not found");

            if (quote.Status != QuotationStatus.Approved && quote.Status != QuotationStatus.SentToCustomer && quote.Status != QuotationStatus.Converted)
                throw new InvalidOperationException($"Cannot convert Quote. Status must be 'Approved' or 'SentToCustomer', but it is '{quote.Status}'.");

            var existingContract = await _context.Contracts.AnyAsync(c => c.ReferenceQuotationId == quotationId);
            if (existingContract)
                throw new InvalidOperationException("A Contract has already been created for this Quotation."); var contract = new Contract
            {
                Title = $"AMC - {quote.QuoteNumber}",
                StartDate = startDate,
                EndDate = startDate.AddMonths(monthsDuration),
                VisitFrequencyMonths = 3, 
                ContractValue = quote.GrandTotal,
                IsActive = true,
                CustomerId = quote.CustomerId,
                ReferenceQuotationId = quote.Id,
                TenantId = quote.TenantId
            };

            quote.Status = QuotationStatus.Converted;

            _context.Contracts.Add(contract);
            await _context.SaveChangesAsync();

            return contract.Id;
        }
    }
}