using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class OfficeService : IOfficeService
    {
        private readonly ApplicationDbContext _context;

        public OfficeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<OfficeDto>> GetAllAsync()
        {
            return await _context.Offices
                .Where(o => !o.IsDeleted)
                .Select(o => new OfficeDto
                {
                    Id = o.Id,
                    Name = o.Name,
                    City = o.City,
                    Address = o.Address
                }).ToListAsync();
        }

        public async Task<OfficeDto> GetByIdAsync(int id)
        {
            var office = await _context.Offices.FindAsync(id);
            if (office == null || office.IsDeleted) throw new System.Exception("Office not found");

            return new OfficeDto
            {
                Id = office.Id,
                Name = office.Name,
                City = office.City,
                Address = office.Address
            };
        }

        public async Task<OfficeDto> CreateAsync(CreateOfficeDto dto)
        {
            var office = new Office
            {
                Name = dto.Name,
                City = dto.City,
                Address = dto.Address
            };

            _context.Offices.Add(office);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(office.Id);
        }

        public async Task<OfficeDto> UpdateAsync(int id, CreateOfficeDto dto)
        {
            var office = await _context.Offices.FindAsync(id);
            if (office == null || office.IsDeleted) throw new System.Exception("Office not found");

            office.Name = dto.Name;
            office.City = dto.City;
            office.Address = dto.Address;
            office.UpdatedAt = System.DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(office.Id);
        }

        public async Task DeleteAsync(int id)
        {
            var office = await _context.Offices.FindAsync(id);
            if (office != null && !office.IsDeleted)
            {
                office.IsDeleted = true;
                office.UpdatedAt = System.DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}
