using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Sales;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.sales;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Quotations;
using MytechERP.domain.Roles;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using MytechERP.domain.Entities;


namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SalesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IBlobService _blobService;
        private readonly INotificationService _notificationService;
        private readonly UserManager<AppUser> _userManager;
        private readonly IEmailService _emailService;

        private const string HuzefaEmail = "m.huzefa@mytecheng.com";
        private const string AliAzeemEmail = "ali.azeem@mytecheng.com";

        // Pakistan Standard Time is UTC+5
        private static DateTime PakistanNow() =>
            TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
                TimeZoneInfo.FindSystemTimeZoneById("Pakistan Standard Time"));

        public SalesController(ApplicationDbContext context, IBlobService blobService, INotificationService notificationService, UserManager<AppUser> userManager, IEmailService emailService)
        {
            _context = context;
            _blobService = blobService;
            _notificationService = notificationService;
            _userManager = userManager;
            _emailService = emailService;
        }

        // ======================= LEADS =======================

        [HttpGet("leads")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult<IEnumerable<SalesLeadDto>>> GetLeads([FromQuery] bool myLeadsOnly = false)
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value;

            var query = _context.SalesLeads
                .Include(l => l.Customer)
                .Include(l => l.Site)
                .Include(l => l.SalesmanUser)
                .Include(l => l.SiteVisits)
                .Include(l => l.AssignedEstimator)
                .AsQueryable();

            if (userRole == Roles.Salesman || myLeadsOnly)
            {
                query = query.Where(l => l.SalesmanUserId == userId);
            }
            else if (userRole == Roles.Estimation)
            {
                if (string.Equals(userEmail, HuzefaEmail, StringComparison.OrdinalIgnoreCase) || string.Equals(userEmail, AliAzeemEmail, StringComparison.OrdinalIgnoreCase))
                {
                    // Huzefa and Ali Azeem can only see leads they created (as salesman) OR leads assigned to them. They shouldn't see each other's leads.
                    query = query.Where(l => l.SalesmanUserId == userId || l.AssignedEstimatorId == userId);
                }
                else
                {
                    // Non-Huzefa and Non-Ali estimators only see leads assigned to them
                    query = query.Where(l => l.AssignedEstimatorId == userId);
                }
            }

            var leads = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();

            // Find any leads whose QuotationId references a deleted quotation and clean up
            var staleLeads = leads
                .Where(l => l.QuotationId.HasValue)
                .ToList();

            if (staleLeads.Any())
            {
                var referencedIds = staleLeads.Select(l => l.QuotationId!.Value).Distinct().ToList();
                var existingQuoteIds = await _context.Quotations
                    .Where(q => referencedIds.Contains(q.Id))
                    .Select(q => q.Id)
                    .ToListAsync();

                var toFix = staleLeads.Where(l => !existingQuoteIds.Contains(l.QuotationId!.Value)).ToList();
                if (toFix.Any())
                {
                    foreach (var lead in toFix)
                    {
                        lead.QuotationId = null;
                        lead.Status = domain.Enums.LeadStatus.Closed;
                    }
                    await _context.SaveChangesAsync();
                }
            }

            var dtos = leads.Select(l => new SalesLeadDto
            {
                Id = l.Id,
                LeadNumber = l.LeadNumber,
                SiteId = l.SiteId,
                SiteName = l.Site?.Name ?? "",
                CustomerId = l.CustomerId,
                CustomerName = l.Customer?.Name ?? "",
                SalesmanUserId = l.SalesmanUserId,
                SalesmanName = l.SalesmanUser?.FullName ?? "",
                Status = l.Status.ToString(),
                Notes = l.Notes,
                BoqFileUrl = _blobService.GenerateSasUrl(l.BOQFileUrl, 120),
                DrawingsFileUrl = _blobService.GenerateSasUrl(l.DrawingsFileUrl, 120),
                DrawingsFileUrls = !string.IsNullOrEmpty(l.DrawingsFileUrlsJson)
                    ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(l.DrawingsFileUrlsJson)?.Select(u => _blobService.GenerateSasUrl(u, 120)).ToList()
                    : null,
                ExtraFileUrls = !string.IsNullOrEmpty(l.ExtraFileUrlsJson)
                    ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(l.ExtraFileUrlsJson)
                    : null,
                QuotationId = l.QuotationId,
                CreatedAt = l.CreatedAt,
                VisitCount = l.SiteVisits.Count(v => !v.IsDeleted),
                AssignedEstimatorId = l.AssignedEstimatorId,
                AssignedEstimatorName = l.AssignedEstimator?.FullName
            });

            return Ok(dtos);
        }

        [HttpGet("leads/{id}")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult<SalesLeadDto>> GetLead(int id)
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            var lead = await _context.SalesLeads
                .Include(l => l.Customer)
                .Include(l => l.Site)
                .Include(l => l.SalesmanUser)
                .Include(l => l.SiteVisits)
                .Include(l => l.AssignedEstimator)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lead == null) return NotFound();

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId)
            {
                return Forbid();
            }

            // Validate QuotationId — clear if the quotation was deleted
            if (lead.QuotationId.HasValue)
            {
                var quotationExists = await _context.Quotations.AnyAsync(q => q.Id == lead.QuotationId.Value);
                if (!quotationExists)
                {
                    lead.QuotationId = null;
                    lead.Status = domain.Enums.LeadStatus.Closed;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new SalesLeadDto
            {
                Id = lead.Id,
                LeadNumber = lead.LeadNumber,
                SiteId = lead.SiteId,
                SiteName = lead.Site?.Name ?? "",
                CustomerId = lead.CustomerId,
                CustomerName = lead.Customer?.Name ?? "",
                SalesmanUserId = lead.SalesmanUserId,
                SalesmanName = lead.SalesmanUser?.FullName ?? "",
                Status = lead.Status.ToString(),
                Notes = lead.Notes,
                BoqFileUrl = _blobService.GenerateSasUrl(lead.BOQFileUrl, 120),
                DrawingsFileUrl = _blobService.GenerateSasUrl(lead.DrawingsFileUrl, 120),
                DrawingsFileUrls = !string.IsNullOrEmpty(lead.DrawingsFileUrlsJson)
                    ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(lead.DrawingsFileUrlsJson)?.Select(u => _blobService.GenerateSasUrl(u, 120)).ToList()
                    : null,
                ExtraFileUrls = !string.IsNullOrEmpty(lead.ExtraFileUrlsJson)
                    ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(lead.ExtraFileUrlsJson)
                    : null,
                QuotationId = lead.QuotationId,
                CreatedAt = lead.CreatedAt,
                VisitCount = lead.SiteVisits.Count(v => !v.IsDeleted),
                AssignedEstimatorId = lead.AssignedEstimatorId,
                AssignedEstimatorName = lead.AssignedEstimator?.FullName
            });
        }

        [HttpPost("leads")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> CreateLead(CreateSalesLeadDto dto)
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(dto.SalesmanUserId))
            {
                dto.SalesmanUserId = userId ?? "";
            }

            if (userRole == Roles.Salesman && dto.SalesmanUserId != userId)
            {
                dto.SalesmanUserId = userId ?? "";
            }

            var lead = new SalesLead
            {
                LeadNumber = "LEAD-" + DateTime.UtcNow.ToString("yyyyMMdd") + new Random().Next(1000, 9999),
                SiteId = dto.SiteId,
                CustomerId = dto.CustomerId,
                SalesmanUserId = dto.SalesmanUserId,
                Notes = dto.Notes,
                Status = domain.Enums.LeadStatus.New
            };

            _context.SalesLeads.Add(lead);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Lead created successfully", Id = lead.Id });
        }

        [HttpPost("initial-client-visit")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> CreateInitialClientVisit([FromForm] CreateInitialClientVisitDto dto, [FromForm] List<IFormFile>? attachments, [FromForm] IFormFile? visitingCardPhoto)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userName = User.Claims.FirstOrDefault(c => c.Type == "FullName")?.Value ?? dto.SalespersonSignatureName;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Create Customer
                var customer = new Customer
                {
                    Name = string.IsNullOrWhiteSpace(dto.Name) ? "Lead By Call" : dto.Name,
                    Email = dto.Email ?? "",
                    Phone = dto.Phone ?? "",
                    TaxNumber = dto.TaxNumber ?? "",
                    Address = dto.Address ?? "",
                    IsProspect = true,
                    ContactPersonName = dto.ContactPersonName,
                    HasVisitingCard = dto.HasVisitingCard,
                    ContractorCompanyName = dto.ContractorCompanyName,
                    FurtherDetails = dto.FurtherDetails,
                    AdditionalContactsJson = dto.AdditionalContactsJson
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                // 2. Create Site
                var site = new Site
                {
                    Name = string.IsNullOrWhiteSpace(dto.SiteName) ? "Unknown Site" : dto.SiteName,
                    City = string.IsNullOrWhiteSpace(dto.SiteCity) ? "Unknown" : dto.SiteCity,
                    Address = string.IsNullOrWhiteSpace(dto.SiteAddress) ? "Unknown" : dto.SiteAddress,
                    Latitude = dto.Latitude,
                    Longitude = dto.Longitude,
                    ProjectStatus = dto.ProjectStatus,
                    CustomerId = customer.Id
                };
                _context.Sites.Add(site);
                await _context.SaveChangesAsync();

                // 3. Create SalesLead
                var lead = new SalesLead
                {
                    LeadNumber = "LEAD-" + DateTime.UtcNow.ToString("yyyyMMdd") + new Random().Next(1000, 9999),
                    SiteId = site.Id,
                    CustomerId = customer.Id,
                    SalesmanUserId = userId ?? "",
                    Notes = dto.Remarks ?? "",
                    Status = domain.Enums.LeadStatus.InProgress,
                    SalespersonSignatureName = userName
                };
                _context.SalesLeads.Add(lead);
                await _context.SaveChangesAsync();

                // 4. Create SiteVisit (First Visit)
                var visit = new SiteVisit
                {
                    SalesLeadId = lead.Id,
                    VisitNumber = 1,
                    StartLatitude = dto.Latitude,
                    StartLongitude = dto.Longitude,
                    EndLatitude = dto.Latitude,
                    EndLongitude = dto.Longitude,
                    StartTime = PakistanNow().AddMinutes(-5),
                    EndTime = PakistanNow(),
                    MeetingNotes = dto.Remarks ?? ""
                };
                _context.SiteVisits.Add(visit);
                await _context.SaveChangesAsync();

                // 5. If Attachments exist
                if (attachments != null && attachments.Any())
                {
                    foreach (var file in attachments)
                    {
                        var blobUrl = await _blobService.UploadAsync(file, $"visit-{visit.Id}-{Guid.NewGuid()}_{file.FileName}");
                        var visitPhoto = new VisitPhoto
                        {
                            SiteVisitId = visit.Id,
                            PhotoUrl = blobUrl,
                            Caption = "Initial Visit Attachment"
                        };
                        _context.VisitPhotos.Add(visitPhoto);
                    }
                    await _context.SaveChangesAsync();
                }

                // 6. If Visiting Card Photo exists
                if (visitingCardPhoto != null)
                {
                    var blobUrl = await _blobService.UploadAsync(visitingCardPhoto, $"visiting-card-{visit.Id}-{Guid.NewGuid()}_{visitingCardPhoto.FileName}");
                    var cardPhotoEntity = new VisitPhoto
                    {
                        SiteVisitId = visit.Id,
                        PhotoUrl = blobUrl,
                        Caption = "Visiting Card"
                    };
                    _context.VisitPhotos.Add(cardPhotoEntity);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return Ok(new { Message = "Client, Lead, and Visit successfully initiated.", LeadId = lead.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Error = "Failed to process workflow", Details = ex.Message });
            }
        }

        [HttpGet("leads/{id}/initial-data")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult<CreateInitialClientVisitDto>> GetInitialClientData(int id)
        {
            var lead = await _context.SalesLeads
                .Include(l => l.Customer)
                .Include(l => l.Site)
                .Include(l => l.SiteVisits)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lead == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            var firstVisit = lead.SiteVisits.OrderBy(v => v.VisitNumber).FirstOrDefault();

            return Ok(new CreateInitialClientVisitDto
            {
                Name = lead.Customer?.Name ?? "",
                Email = lead.Customer?.Email,
                Phone = lead.Customer?.Phone,
                TaxNumber = lead.Customer?.TaxNumber,
                Address = lead.Customer?.Address,
                ContactPersonName = lead.Customer?.ContactPersonName,
                HasVisitingCard = lead.Customer?.HasVisitingCard ?? false,
                ContractorCompanyName = lead.Customer?.ContractorCompanyName,
                FurtherDetails = lead.Customer?.FurtherDetails,
                AdditionalContactsJson = lead.Customer?.AdditionalContactsJson,
                SiteName = lead.Site?.Name ?? "",
                SiteCity = lead.Site?.City ?? "",
                SiteAddress = lead.Site?.Address ?? "",
                Latitude = lead.Site?.Latitude,
                Longitude = lead.Site?.Longitude,
                ProjectStatus = lead.Site?.ProjectStatus,
                Remarks = firstVisit?.MeetingNotes ?? lead.Notes,
                SalespersonSignatureName = lead.SalespersonSignatureName
            });
        }

        [HttpPut("leads/{id}/initial-data")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> UpdateInitialClientData(int id, [FromForm] CreateInitialClientVisitDto dto, [FromForm] List<IFormFile>? attachments, [FromForm] IFormFile? visitingCardPhoto)
        {
            var lead = await _context.SalesLeads
                .Include(l => l.Customer)
                .Include(l => l.Site)
                .Include(l => l.SiteVisits)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lead == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Update Customer
                if (lead.Customer != null)
                {
                    lead.Customer.Name = string.IsNullOrWhiteSpace(dto.Name) ? "Lead By Call" : dto.Name;
                    lead.Customer.Email = dto.Email ?? "";
                    lead.Customer.Phone = dto.Phone ?? "";
                    lead.Customer.TaxNumber = dto.TaxNumber ?? "";
                    lead.Customer.Address = dto.Address ?? "";
                    lead.Customer.ContactPersonName = dto.ContactPersonName;
                    lead.Customer.HasVisitingCard = dto.HasVisitingCard;
                    lead.Customer.ContractorCompanyName = dto.ContractorCompanyName;
                    lead.Customer.FurtherDetails = dto.FurtherDetails;
                    lead.Customer.AdditionalContactsJson = dto.AdditionalContactsJson;
                }

                // Update Site
                if (lead.Site != null)
                {
                    lead.Site.Name = string.IsNullOrWhiteSpace(dto.SiteName) ? "Unknown Site" : dto.SiteName;
                    lead.Site.City = string.IsNullOrWhiteSpace(dto.SiteCity) ? "Unknown" : dto.SiteCity;
                    lead.Site.Address = string.IsNullOrWhiteSpace(dto.SiteAddress) ? "Unknown" : dto.SiteAddress;
                    lead.Site.ProjectStatus = dto.ProjectStatus;
                    if (dto.Latitude.HasValue && dto.Longitude.HasValue)
                    {
                        lead.Site.Latitude = dto.Latitude;
                        lead.Site.Longitude = dto.Longitude;
                    }
                }

                // Update initial visit & lead notes
                var firstVisit = lead.SiteVisits.OrderBy(v => v.VisitNumber).FirstOrDefault();
                if (firstVisit != null)
                {
                    firstVisit.MeetingNotes = dto.Remarks ?? "";

                    if (dto.Latitude.HasValue && dto.Longitude.HasValue)
                    {
                        if (firstVisit.StartLatitude == null) firstVisit.StartLatitude = dto.Latitude;
                        if (firstVisit.StartLongitude == null) firstVisit.StartLongitude = dto.Longitude;
                        if (firstVisit.EndLatitude == null) firstVisit.EndLatitude = dto.Latitude;
                        if (firstVisit.EndLongitude == null) firstVisit.EndLongitude = dto.Longitude;
                    }

                    // If they provided new attachments during edit, attach them to the initial visit
                    if (attachments != null && attachments.Any())
                    {
                        foreach (var file in attachments)
                        {
                            var blobUrl = await _blobService.UploadAsync(file, $"visit-{firstVisit.Id}-{Guid.NewGuid()}_{file.FileName}");
                            var visitPhoto = new VisitPhoto
                            {
                                SiteVisitId = firstVisit.Id,
                                PhotoUrl = blobUrl,
                                Caption = "Initial Visit Attachment (Added via Edit)"
                            };
                            _context.VisitPhotos.Add(visitPhoto);
                        }
                    }

                    if (visitingCardPhoto != null)
                    {
                        var blobUrl = await _blobService.UploadAsync(visitingCardPhoto, $"visiting-card-edit-{firstVisit.Id}-{Guid.NewGuid()}_{visitingCardPhoto.FileName}");
                        var cardPhotoEntity = new VisitPhoto
                        {
                            SiteVisitId = firstVisit.Id,
                            PhotoUrl = blobUrl,
                            Caption = "Visiting Card (Added via Edit)"
                        };
                        _context.VisitPhotos.Add(cardPhotoEntity);
                    }
                }
                // Only update lead notes if it was still the initial one (not strictly necessary to try to match perfectly, replacing is fine)
                lead.Notes = dto.Remarks ?? "";

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { Message = "Client and Project Initial Data updated successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Error = "Failed to update workflow data", Details = ex.Message });
            }
        }

        [HttpPut("leads/{id}")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> UpdateLead(int id, UpdateSalesLeadDto dto)
        {
            var lead = await _context.SalesLeads.FindAsync(id);
            if (lead == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            lead.Notes = dto.Notes;
            if (Enum.TryParse<domain.Enums.LeadStatus>(dto.Status, out var parsedStatus))
            {
                lead.Status = parsedStatus;
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Lead updated successfully" });
        }

        [HttpDelete("leads/{id}")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> DeleteLead(int id)
        {
            var userRoles = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value;

            bool isManagerOrAdmin = userRoles.Contains("Admin") || userRoles.Contains("Manager") || userRoles.Contains("Project Director") || 
                                    userEmail == "munawar.hasan@mytecheng.com" || userEmail == "shahbaz.ali@mytecheng.com";

            if (!isManagerOrAdmin)
            {
                return Forbid();
            }

            var lead = await _context.SalesLeads.FindAsync(id);
            if (lead == null) return NotFound();

            _context.SalesLeads.Remove(lead);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Lead deleted successfully" });
        }

        [HttpPost("leads/{id}/close")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> CloseLead(int id, [FromForm] CloseSalesLeadDto dto)
        {
            var lead = await _context.SalesLeads.FindAsync(id);
            if (lead == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            if (dto.BOQFile != null)
            {
                lead.BOQFileUrl = await _blobService.UploadAsync(dto.BOQFile, $"boq-{id}-{Guid.NewGuid()}_{dto.BOQFile.FileName}");
            }
            
            if (dto.DrawingsFile != null)
            {
                lead.DrawingsFileUrl = await _blobService.UploadAsync(dto.DrawingsFile, $"drawings-{id}-{Guid.NewGuid()}_{dto.DrawingsFile.FileName}");
            }
            
            if (dto.DrawingsFiles != null && dto.DrawingsFiles.Count > 0)
            {
                var drawingsUrls = new System.Collections.Generic.List<string>();
                
                // If it's a single file upload from the new array logic, optionally populate the old column too
                if (dto.DrawingsFiles.Count == 1 && string.IsNullOrEmpty(lead.DrawingsFileUrl))
                {
                    lead.DrawingsFileUrl = await _blobService.UploadAsync(dto.DrawingsFiles[0], $"drawings-{id}-{Guid.NewGuid()}_{dto.DrawingsFiles[0].FileName}");
                    drawingsUrls.Add(lead.DrawingsFileUrl);
                }
                else
                {
                    foreach (var drawingFile in dto.DrawingsFiles)
                    {
                        var url = await _blobService.UploadAsync(drawingFile, $"drawings-{id}-{Guid.NewGuid()}_{drawingFile.FileName}");
                        drawingsUrls.Add(url);
                        
                        // Populate old column with first file if it's empty
                        if (string.IsNullOrEmpty(lead.DrawingsFileUrl))
                        {
                            lead.DrawingsFileUrl = url;
                        }
                    }
                }
                
                lead.DrawingsFileUrlsJson = System.Text.Json.JsonSerializer.Serialize(drawingsUrls);
            }

            if (dto.ExtraFiles != null && dto.ExtraFiles.Count > 0)
            {
                var extraUrls = new System.Collections.Generic.List<string>();
                foreach (var extraFile in dto.ExtraFiles)
                {
                    var url = await _blobService.UploadAsync(extraFile, $"extra-{id}-{Guid.NewGuid()}_{extraFile.FileName}");
                    extraUrls.Add(url);
                }
                lead.ExtraFileUrlsJson = System.Text.Json.JsonSerializer.Serialize(extraUrls);
            }

            if (!string.IsNullOrEmpty(dto.Notes))
            {
                lead.Notes += "\nClose Notes: " + dto.Notes;
            }

            lead.Status = domain.Enums.LeadStatus.Closed;
            await _context.SaveChangesAsync();

            // Notify Huzefa about the BOQ/Drawings submitted
            if (dto.BOQFile != null || dto.DrawingsFile != null)
            {
                var huzefa = await _userManager.FindByEmailAsync(HuzefaEmail);
                if (huzefa != null)
                {
                    await _notificationService.CreateNotificationAsync(
                        userId: huzefa.Id,
                        title: "New BOQ/Drawings Submitted",
                        message: $"Documents submitted for Lead #{lead.LeadNumber} ({lead.Customer?.Name ?? ""}).",
                        type: "BOQ",
                        targetId: lead.Id
                    );

                    // Send email notification to Huzefa
                    var emailBody = $@"
                        <h2>New BOQ/Drawings Submitted</h2>
                        <p>A new document has been submitted for Lead <strong>#{lead.LeadNumber}</strong>.</p>
                        <p>Customer: {lead.Customer?.Name ?? "N/A"}</p>
                        <p>Salesman: {lead.SalesmanUser?.FullName ?? "N/A"}</p>
                        <br/>
                        <p>Please log in to the system to review the documents.</p>";
                    
                    await _emailService.SendEmailAsync(HuzefaEmail, $"New BOQ/Drawings for Lead #{lead.LeadNumber}", emailBody, true);
                }
            }

            return Ok(new { Message = "Lead closed successfully" });
        }

        [HttpPut("leads/{id}/revise-boq")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> ReviseBoq(int id, [FromForm] CloseSalesLeadDto dto)
        {
            var lead = await _context.SalesLeads.FindAsync(id);
            if (lead == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            bool changed = false;
            if (dto.BOQFile != null)
            {
                lead.BOQFileUrl = await _blobService.UploadAsync(dto.BOQFile, $"rev-boq-{id}-{Guid.NewGuid()}_{dto.BOQFile.FileName}");
                changed = true;
            }
            
            if (dto.DrawingsFile != null)
            {
                lead.DrawingsFileUrl = await _blobService.UploadAsync(dto.DrawingsFile, $"rev-drawings-{id}-{Guid.NewGuid()}_{dto.DrawingsFile.FileName}");
                changed = true;
            }
            
            if (dto.DrawingsFiles != null && dto.DrawingsFiles.Count > 0)
            {
                var drawingsUrls = new System.Collections.Generic.List<string>();
                // Keep existing drawing files if any (assuming they were in the JSON array)
                if (!string.IsNullOrEmpty(lead.DrawingsFileUrlsJson))
                {
                    try { drawingsUrls = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.List<string>>(lead.DrawingsFileUrlsJson) ?? new System.Collections.Generic.List<string>(); } catch { }
                }
                
                if (dto.DrawingsFiles.Count == 1 && string.IsNullOrEmpty(lead.DrawingsFileUrl))
                {
                    lead.DrawingsFileUrl = await _blobService.UploadAsync(dto.DrawingsFiles[0], $"rev-drawings-{id}-{Guid.NewGuid()}_{dto.DrawingsFiles[0].FileName}");
                    drawingsUrls.Add(lead.DrawingsFileUrl);
                }
                else
                {
                    foreach (var drawingFile in dto.DrawingsFiles)
                    {
                        var url = await _blobService.UploadAsync(drawingFile, $"rev-drawings-{id}-{Guid.NewGuid()}_{drawingFile.FileName}");
                        drawingsUrls.Add(url);
                        
                        if (string.IsNullOrEmpty(lead.DrawingsFileUrl))
                        {
                            lead.DrawingsFileUrl = url;
                        }
                    }
                }
                
                lead.DrawingsFileUrlsJson = System.Text.Json.JsonSerializer.Serialize(drawingsUrls);
                changed = true;
            }

            if (dto.ExtraFiles != null && dto.ExtraFiles.Count > 0)
            {
                var extraUrls = new List<string>();
                // Keep existing extra files if any
                if (!string.IsNullOrEmpty(lead.ExtraFileUrlsJson))
                {
                    try { extraUrls = System.Text.Json.JsonSerializer.Deserialize<List<string>>(lead.ExtraFileUrlsJson) ?? new List<string>(); } catch { }
                }
                foreach (var extraFile in dto.ExtraFiles)
                {
                    var url = await _blobService.UploadAsync(extraFile, $"rev-extra-{id}-{Guid.NewGuid()}_{extraFile.FileName}");
                    extraUrls.Add(url);
                }
                lead.ExtraFileUrlsJson = System.Text.Json.JsonSerializer.Serialize(extraUrls);
                changed = true;
            }

            if (!string.IsNullOrEmpty(dto.Notes))
            {
                lead.Notes += "\nRevision Notes: " + dto.Notes;
            }

            if (changed)
            {
                lead.Status = domain.Enums.LeadStatus.RevisedBOQ;
            }

            await _context.SaveChangesAsync();

            // Notify Huzefa about revised BOQ
            if (changed)
            {
                var huzefa = await _userManager.FindByEmailAsync(HuzefaEmail);
                if (huzefa != null)
                {
                    await _notificationService.CreateNotificationAsync(
                        userId: huzefa.Id,
                        title: "BOQ/Drawings Revised",
                        message: $"Revised documents submitted for Lead #{lead.LeadNumber}.",
                        type: "BOQ",
                        targetId: lead.Id
                    );
                }
            }

            return Ok(new { Message = "BOQ/Drawings revised successfully" });
        }

        [HttpPost("leads/{id}/reopen")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> ReopenLead(int id)
        {
            var lead = await _context.SalesLeads.FindAsync(id);
            if (lead == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            if (lead.Status != domain.Enums.LeadStatus.Closed && lead.Status != domain.Enums.LeadStatus.ConvertedToQuotation && lead.Status != domain.Enums.LeadStatus.RevisedBOQ)
            {
                return BadRequest(new { Message = "Only closed or converted leads can be reopened" });
            }

            lead.Status = domain.Enums.LeadStatus.InProgress;
            lead.Notes += $"\n[{DateTime.UtcNow.ToString("yyyy-MM-dd")}] Lead Reopened for further visits.";
            
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Lead reopened successfully" });
        }

        [HttpGet("leads/{leadId}/quotes")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> GetLeadQuotes(int leadId)
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            var lead = await _context.SalesLeads.FindAsync(leadId);
            if (lead == null) return NotFound();

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            var quotes = await _context.Quotations
                .Where(q => q.CustomerId == lead.CustomerId && q.SiteId == lead.SiteId)
                .Select(q => new
                {
                    q.Id,
                    q.QuoteNumber,
                    Status = q.Status.ToString(),
                    q.IssueDate,
                    q.ValidUntil,
                    q.GrandTotal,
                    q.Notes
                }).ToListAsync();

            return Ok(quotes);
        }

        // ======================= VISITS =======================

        [HttpGet("leads/{leadId}/visits")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult<IEnumerable<SiteVisitDto>>> GetVisits(int leadId)
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            var lead = await _context.SalesLeads.Include(l => l.Site).FirstOrDefaultAsync(l => l.Id == leadId);
            if (lead == null) return NotFound();

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            var visits = await _context.SiteVisits
                .Include(v => v.Photos)
                .Where(v => v.SalesLeadId == leadId)
                .OrderByDescending(v => v.StartTime)
                .ToListAsync();

            var dtos = visits.Select(v => new SiteVisitDto
            {
                Id = v.Id,
                SalesLeadId = v.SalesLeadId,
                VisitNumber = v.VisitNumber,
                StartTime = v.StartTime,
                EndTime = v.EndTime,
                StartLatitude = v.StartLatitude ?? lead.Site?.Latitude,
                StartLongitude = v.StartLongitude ?? lead.Site?.Longitude,
                EndLatitude = v.EndLatitude ?? lead.Site?.Latitude,
                EndLongitude = v.EndLongitude ?? lead.Site?.Longitude,
                MeetingNotes = v.MeetingNotes,
                CreatedAt = v.CreatedAt,
                Photos = v.Photos.Where(p => !p.IsDeleted).Select(p => new VisitPhotoDto
                {
                    Id = p.Id,
                    PhotoUrl = _blobService.GenerateSasUrl(p.PhotoUrl, 120),
                    Caption = p.Caption,
                    UploadedAt = p.UploadedAt
                }).ToList()
            });

            return Ok(dtos);
        }

        [HttpPost("leads/{leadId}/visits/start")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> StartVisit(int leadId, StartSiteVisitDto dto)
        {
            var lead = await _context.SalesLeads.Include(l => l.SiteVisits).FirstOrDefaultAsync(l => l.Id == leadId);
            if (lead == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            if (lead.Status == domain.Enums.LeadStatus.New)
                lead.Status = domain.Enums.LeadStatus.InProgress;

            var visitNumber = lead.SiteVisits.Any() ? lead.SiteVisits.Max(v => v.VisitNumber) + 1 : 1;

            var visit = new SiteVisit
            {
                SalesLeadId = leadId,
                VisitNumber = visitNumber,
                StartLatitude = dto.StartLatitude,
                StartLongitude = dto.StartLongitude,
                StartTime = PakistanNow()
            };

            _context.SiteVisits.Add(visit);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Visit started", VisitId = visit.Id });
        }

        [HttpPut("visits/{visitId}/end")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> EndVisit(int visitId, EndSiteVisitDto dto)
        {
            var visit = await _context.SiteVisits.Include(v => v.SalesLead).FirstOrDefaultAsync(v => v.Id == visitId);
            if (visit == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman)
            {
                if (string.IsNullOrWhiteSpace(dto.MeetingNotes))
                {
                    return BadRequest(new { Error = "Meeting notes are required to end a visit." });
                }
                
                if (visit.SalesLead!.SalesmanUserId != userId) 
                {
                    return Forbid();
                }
            }

            visit.EndLatitude = dto.EndLatitude;
            visit.EndLongitude = dto.EndLongitude;
            visit.MeetingNotes = dto.MeetingNotes;
            visit.EndTime = PakistanNow();

            if (!string.IsNullOrWhiteSpace(dto.NewContactsJson) && dto.NewContactsJson != "[]")
            {
                var customer = await _context.Customers.FindAsync(visit.SalesLead.CustomerId);
                if (customer != null)
                {
                    try
                    {
                        var newContacts = System.Text.Json.JsonSerializer.Deserialize<List<object>>(dto.NewContactsJson) ?? new List<object>();
                        if (newContacts.Any())
                        {
                            var existingContacts = new List<object>();
                            if (!string.IsNullOrWhiteSpace(customer.AdditionalContactsJson))
                            {
                                existingContacts = System.Text.Json.JsonSerializer.Deserialize<List<object>>(customer.AdditionalContactsJson) ?? new List<object>();
                            }
                            existingContacts.AddRange(newContacts);
                            customer.AdditionalContactsJson = System.Text.Json.JsonSerializer.Serialize(existingContacts);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to parse NewContactsJson in EndVisit: {ex.Message}");
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Visit ended successfully" });
        }

        [HttpPost("visits/{visitId}/photos")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> UploadVisitPhoto(int visitId, [FromForm] IFormFile file, [FromForm] string? caption)
        {
            if (file == null) return BadRequest("File is required");

            var visit = await _context.SiteVisits.Include(v => v.SalesLead).FirstOrDefaultAsync(v => v.Id == visitId);
            if (visit == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && visit.SalesLead!.SalesmanUserId != userId) return Forbid();

            var blobUrl = await _blobService.UploadAsync(file, $"visit-{visitId}-{Guid.NewGuid()}_{file.FileName}");

            var photo = new VisitPhoto
            {
                SiteVisitId = visitId,
                PhotoUrl = blobUrl,
                Caption = caption
            };

            _context.VisitPhotos.Add(photo);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Photo uploaded successfully", PhotoUrl = blobUrl });
        }

        [HttpPut("leads/{id}/assign-estimator")]
        [Authorize(Roles = Roles.AllInternal)]
        public async Task<ActionResult> AssignEstimator(int id, [FromBody] AssignEstimatorDto dto)
        {
            var lead = await _context.SalesLeads
                .Include(l => l.Customer)
                .FirstOrDefaultAsync(l => l.Id == id);
                
            if (lead == null) return NotFound();

            var userEmail = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value;
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;

            if (!string.Equals(userEmail, HuzefaEmail, StringComparison.OrdinalIgnoreCase) && 
                !string.Equals(userEmail, AliAzeemEmail, StringComparison.OrdinalIgnoreCase) && 
                userRole != Roles.Admin && 
                userRole != Roles.CEO && 
                userRole != Roles.ProjectDirector)
            {
                return Forbid();
            }

            if (string.IsNullOrWhiteSpace(dto.EstimatorUserId))
            {
                return BadRequest(new { Error = "Estimator user ID is required." });
            }

            lead.AssignedEstimatorId = dto.EstimatorUserId;
            await _context.SaveChangesAsync();

            // Send Notification to the assigned estimator
            await _notificationService.CreateNotificationAsync(
                userId: dto.EstimatorUserId,
                title: "New Quotation Assignment",
                message: $"You have been assigned to make a quotation for Lead #{lead.LeadNumber} ({lead.Customer?.Name}).",
                type: "Assignment",
                targetId: lead.Id
            );

            return Ok(new { Message = "Estimator assigned successfully and notification sent." });
        }
    }
}

