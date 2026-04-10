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

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SalesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IBlobService _blobService;

        public SalesController(ApplicationDbContext context, IBlobService blobService)
        {
            _context = context;
            _blobService = blobService;
        }

        // ======================= LEADS =======================

        [HttpGet("leads")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<ActionResult<IEnumerable<SalesLeadDto>>> GetLeads()
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            var query = _context.SalesLeads
                .Include(l => l.Customer)
                .Include(l => l.Site)
                .Include(l => l.SalesmanUser)
                .Include(l => l.SiteVisits)
                .AsQueryable();

            if (userRole == Roles.Salesman)
            {
                query = query.Where(l => l.SalesmanUserId == userId);
            }

            var leads = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();

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
                QuotationId = l.QuotationId,
                CreatedAt = l.CreatedAt,
                VisitCount = l.SiteVisits.Count(v => !v.IsDeleted)
            });

            return Ok(dtos);
        }

        [HttpGet("leads/{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<ActionResult<SalesLeadDto>> GetLead(int id)
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            var lead = await _context.SalesLeads
                .Include(l => l.Customer)
                .Include(l => l.Site)
                .Include(l => l.SalesmanUser)
                .Include(l => l.SiteVisits)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lead == null) return NotFound();

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId)
            {
                return Forbid();
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
                QuotationId = lead.QuotationId,
                CreatedAt = lead.CreatedAt,
                VisitCount = lead.SiteVisits.Count(v => !v.IsDeleted)
            });
        }

        [HttpPost("leads")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
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
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
        public async Task<ActionResult> CreateInitialClientVisit([FromForm] CreateInitialClientVisitDto dto, [FromForm] IFormFile? photo, [FromForm] IFormFile? visitingCardPhoto)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userName = User.Claims.FirstOrDefault(c => c.Type == "FullName")?.Value ?? dto.SalespersonSignatureName;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Create Customer
                var customer = new Customer
                {
                    Name = dto.Name,
                    Email = dto.Email ?? "",
                    Phone = dto.Phone ?? "",
                    TaxNumber = dto.TaxNumber ?? "",
                    Address = dto.Address ?? "",
                    IsProspect = true,
                    ContactPersonName = dto.ContactPersonName,
                    HasVisitingCard = dto.HasVisitingCard,
                    ContractorCompanyName = dto.ContractorCompanyName,
                    FurtherDetails = dto.FurtherDetails
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                // 2. Create Site
                var site = new Site
                {
                    Name = dto.SiteName,
                    City = dto.SiteCity,
                    Address = dto.SiteAddress,
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
                    StartTime = DateTime.UtcNow.AddMinutes(-5),
                    EndTime = DateTime.UtcNow,
                    MeetingNotes = dto.Remarks ?? ""
                };
                _context.SiteVisits.Add(visit);
                await _context.SaveChangesAsync();

                // 5. If Photo exists
                if (photo != null)
                {
                    var blobUrl = await _blobService.UploadAsync(photo, $"visit-{visit.Id}-{Guid.NewGuid()}{System.IO.Path.GetExtension(photo.FileName)}");
                    var visitPhoto = new VisitPhoto
                    {
                        SiteVisitId = visit.Id,
                        PhotoUrl = blobUrl,
                        Caption = "Initial Visit Photo"
                    };
                    _context.VisitPhotos.Add(visitPhoto);
                    await _context.SaveChangesAsync();
                }

                // 6. If Visiting Card Photo exists
                if (visitingCardPhoto != null)
                {
                    var blobUrl = await _blobService.UploadAsync(visitingCardPhoto, $"visiting-card-{visit.Id}-{Guid.NewGuid()}{System.IO.Path.GetExtension(visitingCardPhoto.FileName)}");
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
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
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
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
        public async Task<ActionResult> UpdateInitialClientData(int id, [FromForm] CreateInitialClientVisitDto dto, [FromForm] IFormFile? photo, [FromForm] IFormFile? visitingCardPhoto)
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
                    lead.Customer.Name = dto.Name;
                    lead.Customer.Email = dto.Email ?? "";
                    lead.Customer.Phone = dto.Phone ?? "";
                    lead.Customer.TaxNumber = dto.TaxNumber ?? "";
                    lead.Customer.Address = dto.Address ?? "";
                    lead.Customer.ContactPersonName = dto.ContactPersonName;
                    lead.Customer.HasVisitingCard = dto.HasVisitingCard;
                    lead.Customer.ContractorCompanyName = dto.ContractorCompanyName;
                    lead.Customer.FurtherDetails = dto.FurtherDetails;
                }

                // Update Site
                if (lead.Site != null)
                {
                    lead.Site.Name = dto.SiteName;
                    lead.Site.City = dto.SiteCity;
                    lead.Site.Address = dto.SiteAddress;
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

                    // If they provided a new photo during edit, attach it to the initial visit
                    if (photo != null)
                    {
                        var blobUrl = await _blobService.UploadAsync(photo, $"visit-{firstVisit.Id}-{Guid.NewGuid()}{System.IO.Path.GetExtension(photo.FileName)}");
                        var visitPhoto = new VisitPhoto
                        {
                            SiteVisitId = firstVisit.Id,
                            PhotoUrl = blobUrl,
                            Caption = "Initial Visit Photo (Added via Edit)"
                        };
                        _context.VisitPhotos.Add(visitPhoto);
                    }

                    if (visitingCardPhoto != null)
                    {
                        var blobUrl = await _blobService.UploadAsync(visitingCardPhoto, $"visiting-card-edit-{firstVisit.Id}-{Guid.NewGuid()}{System.IO.Path.GetExtension(visitingCardPhoto.FileName)}");
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
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
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
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager)]
        public async Task<ActionResult> DeleteLead(int id)
        {
            var lead = await _context.SalesLeads.FindAsync(id);
            if (lead == null) return NotFound();

            _context.SalesLeads.Remove(lead);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Lead deleted successfully" });
        }

        [HttpPost("leads/{id}/close")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
        public async Task<ActionResult> CloseLead(int id, [FromForm] CloseSalesLeadDto dto)
        {
            var lead = await _context.SalesLeads.FindAsync(id);
            if (lead == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && lead.SalesmanUserId != userId) return Forbid();

            if (dto.BOQFile != null)
            {
                lead.BOQFileUrl = await _blobService.UploadAsync(dto.BOQFile, $"boq-{id}-{Guid.NewGuid()}{System.IO.Path.GetExtension(dto.BOQFile.FileName)}");
            }
            
            if (dto.DrawingsFile != null)
            {
                lead.DrawingsFileUrl = await _blobService.UploadAsync(dto.DrawingsFile, $"drawings-{id}-{Guid.NewGuid()}{System.IO.Path.GetExtension(dto.DrawingsFile.FileName)}");
            }

            if (!string.IsNullOrEmpty(dto.Notes))
            {
                lead.Notes += "\nClose Notes: " + dto.Notes;
            }

            lead.Status = domain.Enums.LeadStatus.Closed;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Lead closed successfully" });
        }

        [HttpPut("leads/{id}/revise-boq")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
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
                lead.BOQFileUrl = await _blobService.UploadAsync(dto.BOQFile, $"rev-boq-{id}-{Guid.NewGuid()}{System.IO.Path.GetExtension(dto.BOQFile.FileName)}");
                changed = true;
            }
            
            if (dto.DrawingsFile != null)
            {
                lead.DrawingsFileUrl = await _blobService.UploadAsync(dto.DrawingsFile, $"rev-drawings-{id}-{Guid.NewGuid()}{System.IO.Path.GetExtension(dto.DrawingsFile.FileName)}");
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
            return Ok(new { Message = "BOQ/Drawings revised successfully" });
        }

        [HttpPost("leads/{id}/reopen")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
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
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
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
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
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
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
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
                StartTime = DateTime.UtcNow
            };

            _context.SiteVisits.Add(visit);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Visit started", VisitId = visit.Id });
        }

        [HttpPut("visits/{visitId}/end")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
        public async Task<ActionResult> EndVisit(int visitId, EndSiteVisitDto dto)
        {
            var visit = await _context.SiteVisits.Include(v => v.SalesLead).FirstOrDefaultAsync(v => v.Id == visitId);
            if (visit == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && visit.SalesLead!.SalesmanUserId != userId) return Forbid();

            visit.EndLatitude = dto.EndLatitude;
            visit.EndLongitude = dto.EndLongitude;
            visit.MeetingNotes = dto.MeetingNotes;
            visit.EndTime = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Visit ended successfully" });
        }

        [HttpPost("visits/{visitId}/photos")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Salesman)]
        public async Task<ActionResult> UploadVisitPhoto(int visitId, [FromForm] IFormFile file, [FromForm] string? caption)
        {
            if (file == null) return BadRequest("File is required");

            var visit = await _context.SiteVisits.Include(v => v.SalesLead).FirstOrDefaultAsync(v => v.Id == visitId);
            if (visit == null) return NotFound();

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (userRole == Roles.Salesman && visit.SalesLead!.SalesmanUserId != userId) return Forbid();

            var blobUrl = await _blobService.UploadAsync(file, $"visit-{visitId}-{Guid.NewGuid()}{System.IO.Path.GetExtension(file.FileName)}");

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
    }
}
