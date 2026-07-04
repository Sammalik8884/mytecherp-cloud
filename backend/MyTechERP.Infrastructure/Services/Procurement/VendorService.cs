using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Procurement;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.Procurement;
using MytechERP.Infrastructure.Persistance;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MytechERP.Infrastructure.Services.Procurement
{
    public class VendorService : IVendorService
    {
        private readonly ApplicationDbContext _context;

        public VendorService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<VendorDto>> GetAllAsync()
        {
            var vendors = await _context.ProcurementVendors.ToListAsync();
            return vendors.Select(MapToDto).ToList();
        }

        public async Task<VendorDto> CreateAsync(VendorDto dto)
        {
            var vendor = new Vendor
            {
                VendorName = dto.VendorName,
                CityName = dto.CityName,
                ContactPerson = dto.ContactPerson,
                ContactNumber = dto.ContactNumber,
                BankAccountName = dto.BankAccountName,
                BankName = dto.BankName,
                AccountNumber = dto.AccountNumber
            };

            _context.ProcurementVendors.Add(vendor);
            await _context.SaveChangesAsync();

            return MapToDto(vendor);
        }

        public async Task<VendorDto> UpdateAsync(int id, VendorDto dto)
        {
            var vendor = await _context.ProcurementVendors.FindAsync(id);
            if (vendor == null) throw new System.Exception("Vendor not found");

            vendor.VendorName = dto.VendorName;
            vendor.CityName = dto.CityName;
            vendor.ContactPerson = dto.ContactPerson;
            vendor.ContactNumber = dto.ContactNumber;
            vendor.BankAccountName = dto.BankAccountName;
            vendor.BankName = dto.BankName;
            vendor.AccountNumber = dto.AccountNumber;

            await _context.SaveChangesAsync();
            return MapToDto(vendor);
        }

        public async Task DeleteAsync(int id)
        {
            var vendor = await _context.ProcurementVendors.FindAsync(id);
            if (vendor != null)
            {
                _context.ProcurementVendors.Remove(vendor);
                await _context.SaveChangesAsync();
            }
        }

        private VendorDto MapToDto(Vendor vendor)
        {
            return new VendorDto
            {
                Id = vendor.Id,
                VendorName = vendor.VendorName,
                CityName = vendor.CityName,
                ContactPerson = vendor.ContactPerson,
                ContactNumber = vendor.ContactNumber,
                BankAccountName = vendor.BankAccountName,
                BankName = vendor.BankName,
                AccountNumber = vendor.AccountNumber
            };
        }
    }
}
