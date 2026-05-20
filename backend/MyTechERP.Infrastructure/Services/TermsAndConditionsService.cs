using Microsoft.EntityFrameworkCore;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.System;
using MytechERP.Infrastructure.Persistance;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class TermsAndConditionsService : ITermsAndConditionsService
    {
        private readonly ApplicationDbContext _context;

        public TermsAndConditionsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<TermsAndConditionsTemplate>> GetAllAsync()
        {
            return await _context.TermsAndConditionsTemplates
                .OrderByDescending(t => t.IsDefault)
                .ThenBy(t => t.Name)
                .ToListAsync();
        }

        public async Task<TermsAndConditionsTemplate> GetByIdAsync(int id)
        {
            return await _context.TermsAndConditionsTemplates.FindAsync(id);
        }

        public async Task<TermsAndConditionsTemplate> GetDefaultAsync()
        {
            return await _context.TermsAndConditionsTemplates.FirstOrDefaultAsync(t => t.IsDefault);
        }

        public async Task<TermsAndConditionsTemplate> CreateAsync(TermsAndConditionsTemplate template)
        {
            if (template.IsDefault)
            {
                await ClearDefaultAsync();
            }

            _context.TermsAndConditionsTemplates.Add(template);
            await _context.SaveChangesAsync();
            return template;
        }

        public async Task<TermsAndConditionsTemplate> UpdateAsync(int id, TermsAndConditionsTemplate template)
        {
            var existing = await _context.TermsAndConditionsTemplates.FindAsync(id);
            if (existing == null) return null;

            if (template.IsDefault && !existing.IsDefault)
            {
                await ClearDefaultAsync();
            }

            existing.Name = template.Name;
            existing.IsDefault = template.IsDefault;
            existing.PaymentAndTax = template.PaymentAndTax;
            existing.Delivery = template.Delivery;
            existing.Warranty = template.Warranty;
            existing.PurchaseOrder = template.PurchaseOrder;
            existing.ValidityAndTransportation = template.ValidityAndTransportation;
            existing.General = template.General;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _context.TermsAndConditionsTemplates.FindAsync(id);
            if (existing == null) return false;

            _context.TermsAndConditionsTemplates.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetDefaultAsync(int id)
        {
            var existing = await _context.TermsAndConditionsTemplates.FindAsync(id);
            if (existing == null) return false;

            await ClearDefaultAsync();
            existing.IsDefault = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task ClearDefaultAsync()
        {
            var existingDefault = await _context.TermsAndConditionsTemplates.FirstOrDefaultAsync(t => t.IsDefault);
            if (existingDefault != null)
            {
                existingDefault.IsDefault = false;
            }
        }
    }
}
