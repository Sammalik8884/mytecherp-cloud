using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;

namespace MyTechERP.Infrastructure.Services
{
    public class DailyProgressReportService : IDailyProgressReportService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IBlobService _blobService;

        public DailyProgressReportService(ApplicationDbContext context, ICurrentUserService currentUserService, IBlobService blobService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _blobService = blobService;
        }

        public async Task<DailyProgressReportDto> CreateAsync(CreateDailyProgressReportDto dto)
        {
            var userId = _currentUserService.UserId;
            var tenantId = _currentUserService.TenantId ?? throw new UnauthorizedAccessException("Tenant ID is required.");

            var report = new DailyProgressReport
            {
                TenantId = tenantId,
                SiteId = dto.SiteId,
                Date = dto.Date,
                SiteInCharge = dto.SiteInCharge,
                SiteOpeningTime = dto.SiteOpeningTime,
                SiteClosingTime = dto.SiteClosingTime,
                TotalWorkers = dto.TotalWorkers,
                NextDayActivityPlan = dto.NextDayActivityPlan,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            foreach (var activity in dto.Activities)
            {
                if (!string.IsNullOrWhiteSpace(activity))
                {
                    report.Activities.Add(new DprActivity { ActivityDone = activity, TenantId = tenantId });
                }
            }

            foreach (var emp in dto.Employees)
            {
                report.Employees.Add(new DprEmployee
                {
                    TenantId = tenantId,
                    EmployeeName = emp.EmployeeName,
                    InTime = emp.InTime,
                    OutTime = emp.OutTime,
                    OverTime = emp.OverTime
                });
            }

            foreach (var mat in dto.Materials)
            {
                report.Materials.Add(new DprMaterial
                {
                    TenantId = tenantId,
                    Item = mat.Item,
                    Quantity = mat.Quantity,
                    Remarks = mat.Remarks
                });
            }

            if (dto.Files != null && dto.Files.Any())
            {
                foreach (var file in dto.Files)
                {
                    if (file.Length > 0)
                    {
                        var folderPath = $"tenant-{tenantId}/dpr-attachments";
                        var blobUrl = await _blobService.UploadAsync(file, folderPath + "/" + file.FileName);
                        var blobName = new Uri(blobUrl).Segments.Last();

                        report.Attachments.Add(new DprAttachment
                        {
                            TenantId = tenantId,
                            FileName = file.FileName,
                            FileUrl = blobUrl,
                            BlobName = blobName
                        });
                    }
                }
            }

            _context.DailyProgressReports.Add(report);
            await _context.SaveChangesAsync();

            return await GetDtoByIdAsync(report.Id);
        }

        public async Task<List<DailyProgressReportDto>> GetBySiteIdAsync(int siteId)
        {
            var reports = await _context.DailyProgressReports
                .Include(d => d.Site)
                .Include(d => d.CreatedByUser)
                .Include(d => d.Activities)
                .Include(d => d.Employees)
                .Include(d => d.Materials)
                .Include(d => d.Attachments)
                .Where(d => d.SiteId == siteId && !d.IsDeleted)
                .OrderByDescending(d => d.Date)
                .ToListAsync();

            return reports.Select(r => MapToDto(r)).ToList();
        }

        public async Task<DailyProgressReportDto> GetByIdAsync(int id)
        {
            var tenantId = _currentUserService.TenantId ?? throw new UnauthorizedAccessException();
            var report = await _context.DailyProgressReports
                .Include(r => r.Activities)
                .Include(r => r.Employees)
                .Include(r => r.Materials)
                .Include(r => r.Attachments)
                .Include(r => r.Site)
                .Include(r => r.CreatedByUser)
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);

            if (report == null) throw new KeyNotFoundException("Report not found");
            return MapToDto(report);
        }

        public async Task DeleteAsync(int id)
        {
            var report = await _context.DailyProgressReports.FirstOrDefaultAsync(d => d.Id == id);
            if (report != null)
            {
                report.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }

        private async Task<DailyProgressReportDto> GetDtoByIdAsync(int id)
        {
            var report = await _context.DailyProgressReports
                .Include(d => d.Site)
                .Include(d => d.CreatedByUser)
                .Include(d => d.Activities)
                .Include(d => d.Employees)
                .Include(d => d.Materials)
                .Include(d => d.Attachments)
                .FirstOrDefaultAsync(d => d.Id == id);
                
            if (report == null) return null;
            return MapToDto(report);
        }

        private DailyProgressReportDto MapToDto(DailyProgressReport report)
        {
            var dto = new DailyProgressReportDto
            {
                Id = report.Id,
                SiteId = report.SiteId,
                SiteName = report.Site?.Name,
                Date = report.Date,
                SiteInCharge = report.SiteInCharge,
                SiteOpeningTime = report.SiteOpeningTime,
                SiteClosingTime = report.SiteClosingTime,
                TotalWorkers = report.TotalWorkers,
                NextDayActivityPlan = report.NextDayActivityPlan,
                CreatedByUserName = report.CreatedByUser != null ? report.CreatedByUser.FullName : string.Empty
            };

            foreach (var a in report.Activities.Where(x => !x.IsDeleted))
                dto.Activities.Add(new DprActivityDto { Id = a.Id, ActivityDone = a.ActivityDone });

            foreach (var e in report.Employees.Where(x => !x.IsDeleted))
                dto.Employees.Add(new DprEmployeeDto { Id = e.Id, EmployeeName = e.EmployeeName, InTime = e.InTime, OutTime = e.OutTime, OverTime = e.OverTime });

            foreach (var m in report.Materials.Where(x => !x.IsDeleted))
                dto.Materials.Add(new DprMaterialDto { Id = m.Id, Item = m.Item, Quantity = m.Quantity, Remarks = m.Remarks });

            foreach (var att in report.Attachments.Where(x => !x.IsDeleted))
                dto.Attachments.Add(new DprAttachmentDto { Id = att.Id, FileName = att.FileName, FileUrl = _blobService.GenerateSasUrl(att.FileUrl, 60, true) });

            return dto;
        }
    }
}