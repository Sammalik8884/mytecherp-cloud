using Microsoft.EntityFrameworkCore;
using MytechERP.domain.Entities;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Repositories
{
    public class ChecklistRepository : IChecklistRepository
    {
        private readonly ApplicationDbContext _context;

        public ChecklistRepository(ApplicationDbContext context)
        { _context = context; }
        public async Task<ChecklistQuestion> AddQuestionAsync(ChecklistQuestion question)
        {
          await  _context.AddAsync(question);
            await _context.SaveChangesAsync();
            return question;
      }
        public async Task<List<ChecklistQuestion>> GetByCategoryIdAsync(int categoryId)
        {
            return await _context.ChecklistQuestions
         .Where(q => q.CategoryId == categoryId)
         .ToListAsync();

        }
    }
}
