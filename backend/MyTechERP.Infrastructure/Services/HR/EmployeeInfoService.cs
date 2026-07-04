using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.HR;
using MytechERP.Application.Interfaces.HR;
using MytechERP.Infrastructure.Persistance;
using MytechERP.domain.Entities.HR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services.HR
{
    public class EmployeeInfoService : IEmployeeInfoService
    {
        private readonly ApplicationDbContext _context;

        public EmployeeInfoService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<EmployeeInfoDto>> GetAllAsync(string? search = null)
        {
            var query = _context.EmployeeInfos.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(e => 
                    (e.EmployeeName != null && e.EmployeeName.Contains(search)) || 
                    (e.EmployeeNumber != null && e.EmployeeNumber.Contains(search)) ||
                    (e.EmployeeCnicNumber != null && e.EmployeeCnicNumber.Contains(search))
                );
            }

            var entities = await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
            return entities.Select(MapToDto).ToList();
        }

        public async Task<EmployeeInfoDto> GetByIdAsync(int id)
        {
            var entity = await _context.EmployeeInfos.FindAsync(id);
            if (entity == null) throw new KeyNotFoundException("Employee Info not found");
            return MapToDto(entity);
        }

        public async Task<EmployeeInfoDto> CreateAsync(CreateEmployeeInfoDto dto, string userId)
        {
            string employeeNumber = dto.EmployeeNumber ?? "";

            if (dto.EmploymentType == "Permanent Employee" && string.IsNullOrWhiteSpace(employeeNumber))
            {
                var lastPermanent = await _context.EmployeeInfos
                    .Where(e => e.EmploymentType == "Permanent Employee" && e.EmployeeNumber != null && e.EmployeeNumber.StartsWith("MTEC EN "))
                    .OrderByDescending(e => e.Id)
                    .FirstOrDefaultAsync();

                int nextNumber = 1;
                if (lastPermanent != null && !string.IsNullOrWhiteSpace(lastPermanent.EmployeeNumber))
                {
                    var parts = lastPermanent.EmployeeNumber.Split(' ');
                    if (parts.Length > 2 && int.TryParse(parts[2], out int lastNum))
                    {
                        nextNumber = lastNum + 1;
                    }
                }
                employeeNumber = $"MTEC EN {nextNumber:D3}";
            }

            var entity = new EmployeeInfo
            {
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                IsActive = dto.IsActive,
                EmploymentType = dto.EmploymentType,
                EmployeeNumber = employeeNumber,
                EmployeeName = dto.EmployeeName,
                MailingAddress = dto.MailingAddress,
                MothersMaidenName = dto.MothersMaidenName,
                GrossSalary = dto.GrossSalary,
                Designation = dto.Designation,
                AccountBranchCode = dto.AccountBranchCode,
                OfficePhoneNo = dto.OfficePhoneNo,
                MobileNetwork = dto.MobileNetwork,
                MobileNumber = dto.MobileNumber,
                PlaceOfBirth = dto.PlaceOfBirth,
                EmailAddress = dto.EmailAddress,
                EmployeeCnicNumber = dto.EmployeeCnicNumber,
                FatherHusbandName = dto.FatherHusbandName,
                Gender = dto.Gender,
                DateOfBirth = dto.DateOfBirth,
                DateOfIssue = dto.DateOfIssue,
                ExpiryDate = dto.ExpiryDate,
                PresentAddress = dto.PresentAddress,
                PaDistrictCity = dto.PaDistrictCity,
                PermanentAddress = dto.PermanentAddress,
                KinFullName = dto.KinFullName,
                KinCnicNumber = dto.KinCnicNumber,
                KinRelationship = dto.KinRelationship,
                KinMobileNumber = dto.KinMobileNumber
            };

            _context.EmployeeInfos.Add(entity);
            await _context.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<EmployeeInfoDto> UpdateAsync(int id, CreateEmployeeInfoDto dto)
        {
            var entity = await _context.EmployeeInfos.FindAsync(id);
            if (entity == null) throw new KeyNotFoundException("Employee Info not found");

            entity.IsActive = dto.IsActive;
            entity.EmploymentType = dto.EmploymentType;
            entity.EmployeeNumber = dto.EmployeeNumber;
            entity.EmployeeName = dto.EmployeeName;
            entity.MailingAddress = dto.MailingAddress;
            entity.MothersMaidenName = dto.MothersMaidenName;
            entity.GrossSalary = dto.GrossSalary;
            entity.Designation = dto.Designation;
            entity.AccountBranchCode = dto.AccountBranchCode;
            entity.OfficePhoneNo = dto.OfficePhoneNo;
            entity.MobileNetwork = dto.MobileNetwork;
            entity.MobileNumber = dto.MobileNumber;
            entity.PlaceOfBirth = dto.PlaceOfBirth;
            entity.EmailAddress = dto.EmailAddress;
            entity.EmployeeCnicNumber = dto.EmployeeCnicNumber;
            entity.FatherHusbandName = dto.FatherHusbandName;
            entity.Gender = dto.Gender;
            entity.DateOfBirth = dto.DateOfBirth;
            entity.DateOfIssue = dto.DateOfIssue;
            entity.ExpiryDate = dto.ExpiryDate;
            entity.PresentAddress = dto.PresentAddress;
            entity.PaDistrictCity = dto.PaDistrictCity;
            entity.PermanentAddress = dto.PermanentAddress;
            entity.KinFullName = dto.KinFullName;
            entity.KinCnicNumber = dto.KinCnicNumber;
            entity.KinRelationship = dto.KinRelationship;
            entity.KinMobileNumber = dto.KinMobileNumber;

            _context.EmployeeInfos.Update(entity);
            await _context.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _context.EmployeeInfos.FindAsync(id);
            if (entity == null) return false;

            _context.EmployeeInfos.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<EmployeeInfoDto> AddAttachmentsAsync(int id, List<string> urls)
        {
            var entity = await _context.EmployeeInfos.FindAsync(id);
            if (entity == null) throw new KeyNotFoundException("Employee Info not found");

            var currentAttachments = entity.Attachments;
            currentAttachments.AddRange(urls);
            entity.Attachments = currentAttachments;

            await _context.SaveChangesAsync();
            return MapToDto(entity);
        }

        private EmployeeInfoDto MapToDto(EmployeeInfo entity)
        {
            return new EmployeeInfoDto
            {
                Id = entity.Id,
                EmploymentType = entity.EmploymentType,
                CreatedByUserId = entity.CreatedByUserId,
                CreatedAt = entity.CreatedAt,
                IsActive = entity.IsActive,
                EmployeeNumber = entity.EmployeeNumber,
                EmployeeName = entity.EmployeeName,
                MailingAddress = entity.MailingAddress,
                MothersMaidenName = entity.MothersMaidenName,
                GrossSalary = entity.GrossSalary,
                Designation = entity.Designation,
                AccountBranchCode = entity.AccountBranchCode,
                OfficePhoneNo = entity.OfficePhoneNo,
                MobileNetwork = entity.MobileNetwork,
                MobileNumber = entity.MobileNumber,
                PlaceOfBirth = entity.PlaceOfBirth,
                EmailAddress = entity.EmailAddress,
                EmployeeCnicNumber = entity.EmployeeCnicNumber,
                FatherHusbandName = entity.FatherHusbandName,
                Gender = entity.Gender,
                DateOfBirth = entity.DateOfBirth,
                DateOfIssue = entity.DateOfIssue,
                ExpiryDate = entity.ExpiryDate,
                PresentAddress = entity.PresentAddress,
                PaDistrictCity = entity.PaDistrictCity,
                PermanentAddress = entity.PermanentAddress,
                KinFullName = entity.KinFullName,
                KinCnicNumber = entity.KinCnicNumber,
                KinRelationship = entity.KinRelationship,
                KinMobileNumber = entity.KinMobileNumber,
                Attachments = entity.Attachments
            };
        }
    }
}
