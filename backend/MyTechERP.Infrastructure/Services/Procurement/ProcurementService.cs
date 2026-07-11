using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Procurement;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.Finance;
using MytechERP.domain.Entities.Procurement;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MytechERP.Infrastructure.Services.Procurement
{
    public class ProcurementService : IProcurementService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly UserManager<AppUser> _userManager;

        public ProcurementService(ApplicationDbContext context, INotificationService notificationService, UserManager<AppUser> userManager)
        {
            _context = context;
            _notificationService = notificationService;
            _userManager = userManager;
        }

        private IQueryable<ProcurementRequest> GetBaseQuery()
        {
            return _context.ProcurementRequests
                .Include(p => p.Items)
                .Include(p => p.Quotes)
                    .ThenInclude(q => q.QuoteItems)
                .Include(p => p.AmountRequestForm);
        }

        private ProcurementRequestDto MapToDto(ProcurementRequest entity)
        {
            return new ProcurementRequestDto
            {
                Id = entity.Id,
                ProcurementNumber = entity.ProcurementNumber,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                SupervisorName = entity.SupervisorName,
                SupervisorEmail = entity.SupervisorEmail,
                SiteId = entity.SiteId,
                Status = entity.Status,
                RegionalHeadEmail = entity.RegionalHeadEmail,
                RegionalHeadRemarks = entity.RegionalHeadRemarks,
                RegionalHeadApprovalDate = entity.RegionalHeadApprovalDate,
                PdEmail = entity.PdEmail,
                PdRemarks = entity.PdRemarks,
                PdApprovalDate = entity.PdApprovalDate,
                ProcurementHeadEmail = entity.ProcurementHeadEmail,
                AmountRequestFormId = entity.AmountRequestFormId,
                AssignedExecutiveEmail = entity.AssignedExecutiveEmail,
                AssignedDate = entity.AssignedDate,
                CompletedDate = entity.CompletedDate,
                DeliveryNoteText = entity.DeliveryNoteText,
                DeliveryNoteDocuments = entity.DeliveryNoteDocuments,
                IsArfApproved = entity.AmountRequestForm != null && entity.AmountRequestForm.Status == "Done",
                IsAcceptedBySupervisor = entity.IsAcceptedBySupervisor,
                SupervisorAcceptanceDate = entity.SupervisorAcceptanceDate,
                SupervisorAcceptanceRemarks = entity.SupervisorAcceptanceRemarks,
                Items = entity.Items.Select(i => new ProcurementRequestItemDto
                {
                    Id = i.Id,
                    ProcurementRequestId = i.ProcurementRequestId,
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    Reason = i.Reason
                }).ToList(),
                Quotes = entity.Quotes.Select(q => new ProcurementQuoteDto
                {
                    Id = q.Id,
                    VendorName = q.VendorName,
                    CityName = q.CityName,
                    ContactPerson = q.ContactPerson,
                    ContactNumber = q.ContactNumber,
                    BankAccountName = q.BankAccountName,
                    BankName = q.BankName,
                    AccountNumber = q.AccountNumber,
                    TotalAmount = q.TotalAmount,
                    IsSelected = q.IsSelected,
                    SubmittedAt = q.SubmittedAt,
                    QuoteItems = q.QuoteItems.Select(qi => new ProcurementQuoteItemDto
                    {
                        Id = qi.Id,
                        ProcurementRequestItemId = qi.ProcurementRequestItemId,
                        UnitRate = qi.UnitRate,
                        LineTotal = qi.LineTotal
                    }).ToList()
                }).ToList()
            };
        }

        private async Task<List<ProcurementRequestDto>> MapToDtoListAsync(List<ProcurementRequest> requests)
        {
            var dtos = requests.Select(MapToDto).ToList();
            
            // Map ARF Statuses
            var arfIds = dtos.Where(d => d.AmountRequestFormId.HasValue).Select(d => d.AmountRequestFormId!.Value).Distinct().ToList();
            if (arfIds.Any())
            {
                var arfStatuses = await _context.AmountRequestForms
                    .Where(a => arfIds.Contains(a.Id))
                    .ToDictionaryAsync(a => a.Id, a => a.Status);

                foreach (var dto in dtos)
                {
                    if (dto.AmountRequestFormId.HasValue && arfStatuses.ContainsKey(dto.AmountRequestFormId.Value))
                    {
                        var status = arfStatuses[dto.AmountRequestFormId.Value];
                        // An ARF is typically "Released" or "Approved" when it's fully done
                        dto.IsArfApproved = (status == "Released" || status == "Approved");
                    }
                }
            }

            var emailsToLookup = dtos.Where(d => d.SupervisorName != null && d.SupervisorName.Contains("@")).Select(d => d.SupervisorName).Distinct().ToList();
            if (emailsToLookup.Any())
            {
                var users = await _context.Users.Where(u => emailsToLookup.Contains(u.Email)).ToDictionaryAsync(u => u.Email, u => u.FullName);
                foreach (var dto in dtos)
                {
                    if (dto.SupervisorName != null && dto.SupervisorName.Contains("@") && users.ContainsKey(dto.SupervisorName) && !string.IsNullOrEmpty(users[dto.SupervisorName]))
                    {
                        dto.SupervisorName = users[dto.SupervisorName];
                    }
                }
            }
            return dtos;
        }

        public async Task<List<ProcurementRequestDto>> GetAllProcurementsAsync(string userId, string role)
        {
            var query = GetBaseQuery();

            if (role == "Site Supervisor" || role == "SiteSupervisor")
            {
                query = query.Where(p => p.SupervisorEmail == userId);
            }
            else if (role == "Procurement Executive")
            {
                query = query.Where(p => p.AssignedExecutiveEmail == userId);
            }
            else if (role == "Regional Head")
            {
                // Can see pending regional head approvals or those they approved
                query = query.Where(p => p.Status == "PendingRegionalHead" || p.RegionalHeadEmail == userId);
            }

            var requests = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
            return await MapToDtoListAsync(requests);
        }

        public async Task<List<ProcurementRequestDto>> GetPendingPdApprovalsAsync()
        {
            var requests = await GetBaseQuery()
                .Where(p => p.Status == "PendingPDApproval")
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return await MapToDtoListAsync(requests);
        }

        public async Task<List<ProcurementRequestDto>> GetApprovedRequestsAsync()
        {
            var validStatuses = new[] { "ApprovedByPD", "AssignedToExecutive", "QuotesSubmitted", "ARFCreated", "ReadyToProcure" };
            var requests = await GetBaseQuery()
                .Where(p => validStatuses.Contains(p.Status))
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return await MapToDtoListAsync(requests);
        }

        public async Task<List<ProcurementRequestDto>> GetPendingProcurementsForExecutiveAsync(string executiveEmail)
        {
            var validStatuses = new[] { "AssignedToExecutive", "ReadyToProcure" };
            var requests = await GetBaseQuery()
                .Where(p => p.AssignedExecutiveEmail == executiveEmail && validStatuses.Contains(p.Status))
                .OrderByDescending(p => p.AssignedDate)
                .ToListAsync();

            return await MapToDtoListAsync(requests);
        }

        public async Task<List<ProcurementRequestDto>> GetCompletedProcurementsForExecutiveAsync(string executiveEmail)
        {
            var requests = await GetBaseQuery()
                .Where(p => p.AssignedExecutiveEmail == executiveEmail && p.Status == "Completed")
                .OrderByDescending(p => p.CompletedDate)
                .ToListAsync();

            return await MapToDtoListAsync(requests);
        }

        public async Task<ProcurementRequestDto> GetByIdAsync(int id)
        {
            var request = await GetBaseQuery().FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            var dtoList = await MapToDtoListAsync(new List<ProcurementRequest> { request });
            return dtoList.First();
        }

        public async Task<ProcurementRequestDto> CreateRequestAsync(CreateProcurementRequestDto dto, string supervisorName, string supervisorEmail)
        {
            var today = DateTime.UtcNow;
            var count = await _context.ProcurementRequests.CountAsync(p => p.CreatedAt.Year == today.Year && p.CreatedAt.Month == today.Month);
            var procNum = $"PR-{today:yyyyMM}-{count + 1:D4}";

            var request = new ProcurementRequest
            {
                ProcurementNumber = procNum,
                SupervisorName = supervisorName,
                SupervisorEmail = supervisorEmail,
                SiteId = dto.SiteId,
                Status = "PendingRegionalHead",
                Items = dto.Items.Select(i => new ProcurementRequestItem
                {
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    Reason = i.Reason
                }).ToList()
            };

            _context.ProcurementRequests.Add(request);
            await _context.SaveChangesAsync();

            var title = "New Procurement Request";
            var msg = $"A new procurement request ({procNum}) has been submitted and is awaiting your review.";
            var link = "/procurement-flow/regional-approvals";
            await NotifyUsersByRoleAsync("Regional Head", title, msg, link);

            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> ReviewByRegionalHeadAsync(int id, RegionalHeadReviewDto dto, string rhEmail)
        {
            var request = await GetBaseQuery().FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            request.RegionalHeadEmail = rhEmail;
            request.RegionalHeadRemarks = dto.Remarks;
            request.RegionalHeadApprovalDate = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;

            if (dto.IsApproved)
            {
                if (dto.UpdatedItems != null && dto.UpdatedItems.Any())
                {
                    var updatedItemIds = dto.UpdatedItems.Where(i => i.ItemId.HasValue && i.ItemId.Value > 0).Select(i => i.ItemId.Value).ToList();
                    var itemsToRemove = request.Items.Where(i => !updatedItemIds.Contains(i.Id)).ToList();
                    _context.ProcurementRequestItems.RemoveRange(itemsToRemove);

                    foreach (var upItem in dto.UpdatedItems)
                    {
                        if (upItem.ItemId.HasValue && upItem.ItemId.Value > 0)
                        {
                            var existing = request.Items.FirstOrDefault(i => i.Id == upItem.ItemId.Value);
                            if (existing != null)
                            {
                                existing.ItemName = upItem.ItemName;
                                existing.Quantity = upItem.Quantity;
                                existing.Reason = upItem.Reason;
                            }
                        }
                        else
                        {
                            request.Items.Add(new domain.Entities.Procurement.ProcurementRequestItem
                            {
                                ItemName = upItem.ItemName,
                                Quantity = upItem.Quantity,
                                Reason = upItem.Reason
                            });
                        }
                    }
                }

                request.Status = "PendingPDApproval";
                
                await NotifyUsersByRoleAsync("Project Director", "Procurement Request Awaiting Approval", $"Procurement request {request.ProcurementNumber} has been approved by the Regional Head and awaits your approval.", "/procurement-flow/pending-approvals");
                await NotifyUsersByRoleAsync("Manager", "Procurement Request Awaiting Approval", $"Procurement request {request.ProcurementNumber} has been approved by the Regional Head.", "/procurement-flow/pending-approvals");
                await NotifyUserByEmailAsync(request.SupervisorEmail, "Procurement Request Approved", $"Your procurement request {request.ProcurementNumber} was approved by the Regional Head and forwarded to the Project Director.", $"/procurement-flow/{request.Id}");
            }
            else
            {
                request.Status = "RejectedByRegionalHead";
                await NotifyUserByEmailAsync(request.SupervisorEmail, "Procurement Request Rejected", $"Your procurement request {request.ProcurementNumber} was rejected by the Regional Head. Remarks: {dto.Remarks}", "/procurement-flow/dashboard");
            }

            await _context.SaveChangesAsync();
            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> ReviewByPdAsync(int id, PdReviewProcurementDto dto, string pdEmail)
        {
            var request = await GetBaseQuery().FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            request.PdEmail = pdEmail;
            request.PdRemarks = dto.Remarks;
            request.PdApprovalDate = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;

            if (dto.IsApproved)
            {
                request.Status = "ApprovedByPD";
                await NotifyUsersByRoleAsync("Procurement Head", "Procurement Request Approved", $"Procurement request {request.ProcurementNumber} has been approved by PD. Please assign an executive.", "/procurement-flow/approved");
                await NotifyUserByEmailAsync(request.SupervisorEmail, "Procurement Request Approved by PD", $"Your procurement request {request.ProcurementNumber} was approved by the Project Director.", $"/procurement-flow/{request.Id}");
            }
            else
            {
                request.Status = "RejectedByPD";
                await NotifyUserByEmailAsync(request.SupervisorEmail, "Procurement Request Rejected", $"Your procurement request {request.ProcurementNumber} was rejected by the Project Director. Remarks: {dto.Remarks}", "/procurement-flow/dashboard");
            }

            await _context.SaveChangesAsync();
            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> AssignExecutiveAsync(int id, AssignProcurementExecutiveDto dto)
        {
            var request = await GetBaseQuery().FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            request.AssignedExecutiveEmail = dto.ExecutiveEmail;
            request.AssignedDate = DateTime.UtcNow;
            request.Status = "AssignedToExecutive";
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await NotifyUserByEmailAsync(request.AssignedExecutiveEmail, "New Procurement Assigned", $"You have been assigned procurement {request.ProcurementNumber} to collect vendor rates.", "/procurement-flow/pending-procurements");
            await NotifyUserByEmailAsync(request.SupervisorEmail, "Procurement Assigned", $"Your procurement {request.ProcurementNumber} has been assigned to {dto.ExecutiveEmail}.", "/procurement-flow/dashboard");

            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> SubmitVendorQuotesAsync(int id, SubmitVendorQuotesDto dto)
        {
            var request = await GetBaseQuery().FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            if (request.Status != "AssignedToExecutive")
                throw new Exception("Request is not in a state to accept quotes.");

            // Add the new quotes
            decimal lowestTotal = decimal.MaxValue;
            ProcurementQuote? lowestQuote = null;

            foreach (var quoteDto in dto.Quotes)
            {
                var vendor = await _context.ProcurementVendors.FirstOrDefaultAsync(v => v.VendorName == quoteDto.VendorName && v.CityName == quoteDto.CityName);
                if (vendor == null)
                {
                    vendor = new Vendor
                    {
                        VendorName = quoteDto.VendorName,
                        CityName = quoteDto.CityName,
                        ContactPerson = quoteDto.ContactPerson,
                        ContactNumber = quoteDto.ContactNumber,
                        BankAccountName = quoteDto.BankAccountName,
                        BankName = quoteDto.BankName,
                        AccountNumber = quoteDto.AccountNumber
                    };
                    _context.ProcurementVendors.Add(vendor);
                }
                else
                {
                    vendor.ContactPerson = quoteDto.ContactPerson ?? vendor.ContactPerson;
                    vendor.ContactNumber = quoteDto.ContactNumber ?? vendor.ContactNumber;
                    vendor.BankAccountName = quoteDto.BankAccountName ?? vendor.BankAccountName;
                    vendor.BankName = quoteDto.BankName ?? vendor.BankName;
                    vendor.AccountNumber = quoteDto.AccountNumber ?? vendor.AccountNumber;
                }

                var quote = new ProcurementQuote
                {
                    VendorName = quoteDto.VendorName,
                    CityName = quoteDto.CityName,
                    ContactPerson = quoteDto.ContactPerson,
                    ContactNumber = quoteDto.ContactNumber,
                    BankAccountName = quoteDto.BankAccountName,
                    BankName = quoteDto.BankName,
                    AccountNumber = quoteDto.AccountNumber,
                    TotalAmount = quoteDto.Items.Sum(i => i.UnitRate * (request.Items.FirstOrDefault(x => x.Id == i.ProcurementRequestItemId)?.Quantity ?? 0)),
                    IsSelected = false,
                    QuoteItems = quoteDto.Items.Select(i => new ProcurementQuoteItem
                    {
                        ProcurementRequestItemId = i.ProcurementRequestItemId,
                        UnitRate = i.UnitRate,
                        LineTotal = i.UnitRate * (request.Items.FirstOrDefault(x => x.Id == i.ProcurementRequestItemId)?.Quantity ?? 0)
                    }).ToList()
                };

                request.Quotes.Add(quote);

                if (quote.TotalAmount < lowestTotal)
                {
                    lowestTotal = quote.TotalAmount;
                    lowestQuote = quote;
                }
            }

            // Auto-select lowest
            if (lowestQuote != null)
            {
                lowestQuote.IsSelected = true;
            }

            request.Status = "QuotesSubmitted";
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await NotifyUsersByRoleAsync("Procurement Head", "Vendor Quotes Submitted", $"Vendor quotes for {request.ProcurementNumber} have been submitted. You can now generate the ARF.", "/procurement-flow/approved");

            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> GenerateArfAsync(int procurementId, string procurementHeadEmail, string arfDetailsUrl)
        {
            var request = await GetBaseQuery().FirstOrDefaultAsync(p => p.Id == procurementId);
            if (request == null) throw new Exception("Procurement request not found");
            
            // This method might be called directly, but we assume the frontend sends the ARF generation through the actual ARF Controller now,
            // or the frontend calls this and we just create a dummy ARF. Since the user wants the form to popup and fill in details, 
            // the frontend will likely call the ARF creation endpoint.
            // If they call this endpoint, we'll mark it as ARFCreated and expect the ARF ID to be updated separately or created here.
            // Let's create a basic ARF here which the frontend can then redirect to for editing, OR the frontend just calls this to link an existing ARF.
            // To align with the user's request: "ARF Form will popedup with auto fetch site name... then he submit".
            // So the frontend creates the ARF via AmountRequestFormsController, and then we need a way to link it.
            // Let's just create it here as "Draft" and return it, OR the frontend does it entirely and just links.
            // We will just leave this method as is, but it expects the ARF to be created. 
            // I'll rewrite this to just mark the ARF as created if the UI handles it separately, but keeping existing logic is safer.
            
            var selectedQuote = request.Quotes.FirstOrDefault(q => q.IsSelected);
            var totalAmount = selectedQuote?.TotalAmount ?? 0;

            var arf = new AmountRequestForm
            {
                EmployeeName = "Procurement Head", 
                EmployeeEmail = procurementHeadEmail,
                PurposeOfAdvance = $"Procurement for Request {request.ProcurementNumber}",
                SiteId = request.SiteId,
                AdvanceRequested = totalAmount,
                Status = "PendingDirector", 
                ArfNumber = $"ARF-{DateTime.UtcNow:yyyyMMddHHmmss}"
            };

            _context.AmountRequestForms.Add(arf);
            await _context.SaveChangesAsync();

            request.AmountRequestFormId = arf.Id;
            request.Status = "ARFCreated";
            request.UpdatedAt = DateTime.UtcNow;
            request.ProcurementHeadEmail = procurementHeadEmail;
            
            await _context.SaveChangesAsync();
            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> ProcureAsync(int id)
        {
            var request = await GetBaseQuery().FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            request.Status = "ReadyToProcure";
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await NotifyUserByEmailAsync(request.AssignedExecutiveEmail, "Ready to Procure", $"The ARF for {request.ProcurementNumber} has been approved. You can now procure the items.", "/procurement-flow/pending-procurements");

            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> CompleteProcurementAsync(int id, CompleteProcurementDto dto)
        {
            var request = await GetBaseQuery().FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");

            if (string.IsNullOrWhiteSpace(dto.DeliveryNoteText) && (dto.DeliveryNoteDocuments == null || dto.DeliveryNoteDocuments.Count == 0))
            {
                throw new Exception("At least one delivery note (text or document) is required.");
            }

            request.DeliveryNoteText = dto.DeliveryNoteText;
            request.DeliveryNoteDocuments = dto.DeliveryNoteDocuments ?? new List<string>();
            request.CompletedDate = DateTime.UtcNow;
            request.Status = "Completed";
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await NotifyUserByEmailAsync(request.SupervisorEmail, "Procurement Completed", $"Procurement {request.ProcurementNumber} has been completed and delivery notes attached.", "/procurement-flow/dashboard");

            if (!string.IsNullOrEmpty(request.ProcurementHeadEmail))
            {
                await NotifyUserByEmailAsync(request.ProcurementHeadEmail, "Procurement Completed", $"Procurement {request.ProcurementNumber} has been completed by {request.AssignedExecutiveEmail}.", "/procurement-flow/dashboard");
            }

            return MapToDto(request);
        }

        public async Task<ProcurementRequestDto> AcceptDeliveryAsync(int id, AcceptProcurementDto dto, string supervisorEmail)
        {
            var request = await GetBaseQuery().FirstOrDefaultAsync(p => p.Id == id);
            if (request == null) throw new Exception("Procurement request not found");
            if (request.SupervisorEmail != supervisorEmail) throw new Exception("Only the original requester (Site Supervisor) can accept the delivery.");
            if (request.Status != "Completed") throw new Exception("Procurement is not in completed state to accept.");

            request.IsAcceptedBySupervisor = dto.IsAccepted;
            request.SupervisorAcceptanceDate = DateTime.UtcNow;
            request.SupervisorAcceptanceRemarks = dto.Remarks;
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(request.ProcurementHeadEmail))
            {
                string status = dto.IsAccepted ? "Accepted" : "Rejected";
                await NotifyUserByEmailAsync(request.ProcurementHeadEmail, $"Procurement Delivery {status}", $"Site Supervisor has {status.ToLower()} the delivery for {request.ProcurementNumber}.", "/procurement-flow/dashboard");
            }

            return MapToDto(request);
        }

        private async Task NotifyUsersByRoleAsync(string roleName, string title, string message, string type)
        {
            try 
            {
                var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
                foreach (var user in usersInRole)
                {
                    await _notificationService.CreateNotificationAsync(user.Id, title, message, type);
                }
            } 
            catch (Exception)
            {
                // Role might not exist, just ignore for now so we don't crash the operation
            }
        }

        private async Task NotifyUserByEmailAsync(string email, string title, string message, string type)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user != null)
            {
                await _notificationService.CreateNotificationAsync(user.Id, title, message, type);
            }
        }
    }
}
