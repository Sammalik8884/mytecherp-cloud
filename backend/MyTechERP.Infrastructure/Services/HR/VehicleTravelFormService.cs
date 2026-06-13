using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.HR;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.HR;

using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services.HR
{
    public class VehicleTravelFormService : IVehicleTravelFormService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBlobService _blobService;

        private readonly string[] _privilegedEmails = new[] 
        { 
            "faisal.ghani@mytecheng.com", 
            "shahbaz.ali@mytecheng.com", 
            "munawar.hasan@mytecheng.com" 
        };

        public VehicleTravelFormService(ApplicationDbContext context, IBlobService blobService)
        {
            _context = context;
            _blobService = blobService;
        }

        public async Task<VehicleTravelFormDto> CreateAsync(CreateVehicleTravelFormDto dto, string userId)
        {
            var entity = new VehicleTravelForm
            {
                EmployeeName = dto.EmployeeName,
                EmployeeId = dto.EmployeeId,
                Contact = dto.Contact,
                VehicleName = dto.VehicleName,
                RegistrationNumber = dto.RegistrationNumber,
                StartReading = dto.StartReading,
                EndReading = dto.EndReading,
                CurrentDate = dto.CurrentDate,
                CreatedByUserId = userId,
            };

            if (dto.Attachments != null && dto.Attachments.Any())
            {
                foreach (var file in dto.Attachments)
                {
                    var fileUrl = await _blobService.UploadFileAsync(file, "vehicle-travel-forms");
                    entity.Attachments.Add(new VehicleTravelFormAttachment
                    {
                        FileName = file.FileName,
                        FileUrl = fileUrl
                    });
                }
            }

            _context.VehicleTravelForms.Add(entity);
            await _context.SaveChangesAsync();

            // Fetch with user included to get CreatedByUserName
            var savedEntity = await _context.VehicleTravelForms
                .Include(v => v.CreatedByUser)
                .Include(v => v.Attachments)
                .FirstOrDefaultAsync(v => v.Id == entity.Id);

            return MapToDto(savedEntity);
        }

        public async Task<List<VehicleTravelFormDto>> GetAllAsync(string userEmail, string userId)
        {
            var query = _context.VehicleTravelForms
                .Include(v => v.CreatedByUser)
                .Include(v => v.Attachments)
                .AsQueryable();

            if (!string.IsNullOrEmpty(userEmail) && _privilegedEmails.Contains(userEmail.ToLower()))
            {
                // Can see all forms
            }
            else
            {
                // Can only see own forms
                query = query.Where(v => v.CreatedByUserId == userId);
            }

            var entities = await query.OrderByDescending(v => v.CurrentDate).ToListAsync();
            return entities.Select(MapToDto).ToList();
        }

        private VehicleTravelFormDto MapToDto(VehicleTravelForm entity)
        {
            return new VehicleTravelFormDto
            {
                Id = entity.Id,
                CreatedAt = entity.CreatedAt,
                EmployeeName = entity.EmployeeName,
                EmployeeId = entity.EmployeeId,
                Contact = entity.Contact,
                VehicleName = entity.VehicleName,
                RegistrationNumber = entity.RegistrationNumber,
                StartReading = entity.StartReading,
                EndReading = entity.EndReading,
                CurrentDate = entity.CurrentDate,
                CreatedByUserId = entity.CreatedByUserId,
                CreatedByUserName = entity.CreatedByUser?.FullName,
                Attachments = entity.Attachments?.Select(a => new VehicleTravelFormAttachmentDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    FileUrl = a.FileUrl
                }).ToList() ?? new List<VehicleTravelFormAttachmentDto>()
            };
        }
    }
}
