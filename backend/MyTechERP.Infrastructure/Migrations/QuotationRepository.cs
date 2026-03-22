using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Quotations;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Repositories
{
    public class QuotationRepository : IQuotationRepository
    {
        private readonly ApplicationDbContext _context;

        public QuotationRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<Quotation?> GetQuoteWithItemsAsync(int id)
        {
           return await _context.Quotations.Include(q=>q.Items).Include(q=>q.Customer).Include(q=>q.Site).FirstOrDefaultAsync(q=>q.Id==id);

        }
        public async Task<Quotation> AddQuotationWithItemAsync(Quotation quotation)
        {
            _context.Quotations.Add(quotation);
            await _context.SaveChangesAsync();
            return quotation;
        }
        public async Task<Quotation> UpdateQuoteWithItemsAsync(int id,Quotation quotation)
        {
            var toUpdate = await _context.Quotations.FindAsync(id);

            if (toUpdate == null)
            {
                return null;
              
            }
            _context.Entry(toUpdate).CurrentValues.SetValues(quotation);
            await _context.SaveChangesAsync();
            return toUpdate;
        }
        public async Task<IEnumerable<Quotation>> GetAllAsync()
        {
            return await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Items)
                .OrderByDescending(q => q.Id)
                .ToListAsync();
        }
        public async Task DeleteQuoteWithItemsAsync(int id)
        {
            var toRemove= await _context.Quotations.FindAsync(id);
            if (toRemove != null)
            {
                _context.Quotations.Remove(toRemove);
                await _context.SaveChangesAsync();
            }
        }
        public async Task<Quotation> AddQuoteWithItemsAsync(Quotation  quotation)
        {
            _context.Quotations.Add(quotation);
            await _context.SaveChangesAsync();
            return quotation;
        }
    }
}