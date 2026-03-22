using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MimeKit.Cryptography;
using MytechERP.Application.DTOs.Quotations;
using MytechERP.Application.DTOs.sales;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities;
using MytechERP.domain.Entities.CRM;
using Microsoft.AspNetCore.Identity;
using MytechERP.domain.Enums;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Quotations;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using static MytechERP.domain.Quotations.Quotation;

namespace MyTechERP.Infrastructure.Services
{
    public class QuotationService : IQuotationService
    {
        private readonly IBackgroundTaskQueue _queue;
        private readonly IQuotationRepository _quotationRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;
        private readonly IDigitalSignatureService _digitalSignatureService;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;
        private readonly UserManager<AppUser> _userManager;

        public QuotationService( IBackgroundTaskQueue queue,
            IQuotationRepository quotationRepository,
            ICurrentUserService currentUserService,
            ApplicationDbContext context,IAuditService auditService, IDigitalSignatureService digitalSignatureService, IEmailService  emailService, INotificationService notificationService, UserManager<AppUser> userManager )

        {
            _quotationRepository = quotationRepository;
            _currentUserService = currentUserService;
            _context = context;
            _auditService = auditService;
            _digitalSignatureService = digitalSignatureService;
            _emailService = emailService;
            _queue = queue;
            _notificationService = notificationService;
            _userManager = userManager;
        }


        public async Task<QuotationDto> CreateQuoteAsync(CreateQuotationDto dto)
        {
            if (dto.Items == null || !dto.Items.Any())
                throw new Exception("Cannot create a quotation with 0 items.");

            string quoteNumber = $"QT-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";

            var quotation = new Quotation
            {
                QuoteNumber = quoteNumber,
                CustomerId = dto.CustomerId,
                OpportunityId = (dto.OpportunityId.HasValue && dto.OpportunityId.Value > 0) ? dto.OpportunityId : null,
                SiteId = (dto.SiteId.HasValue && dto.SiteId.Value > 0) ? dto.SiteId : null,

                Status = QuotationStatus.Draft,
                CreatedAt = DateTime.UtcNow,
                ValidUntil = DateTime.UtcNow.AddDays(30),
                TenantId = _currentUserService.TenantId ?? 0,
                AssetId=dto.AssetId,
                Currency = dto.Currency,
                ExchangeRate = dto.ExchangeRate <= 0 ? 1 : dto.ExchangeRate,
                GlobalCommissionPct = dto.GlobalCommissionPct,
                GSTPercentage = dto.GSTPercentage,
                IncomeTaxPercentage = dto.IncomeTaxPercentage,
                Adjustment = dto.Adjustment,
                CreatedByUserId= _currentUserService.UserId

                
            };

            await CalculateAndAddItemsAsync(quotation, dto.Items);

            await _quotationRepository.AddQuoteWithItemsAsync(quotation);

            var userId = _currentUserService.UserId ?? "System";
            await _auditService.LogAsync(
                userId,
                "Quotation",
                quotation.Id,
                "Create",
                $"Quotation {quotation.QuoteNumber} created.",
                "0.00",
                quotation.GrandTotal.ToString("N2")
            );

            return await GetQuoteByIdAsync(quotation.Id);
        }

        public async Task<QuotationDto> UpdateQuoteAsync(int id, CreateQuotationDto dto)
        {
            var existingQuote = await _quotationRepository.GetQuoteWithItemsAsync(id);
            if (existingQuote == null) throw new Exception($"Quotation {id} not found");

            var oldGrandTotal = existingQuote.GrandTotal;
            var userId = _currentUserService.UserId ?? "System";

            var customerExists = await _context.Customers.AnyAsync(c => c.Id == dto.CustomerId);
            if (!customerExists)
                throw new KeyNotFoundException($"Customer ID {dto.CustomerId} does not exist.");

            if (dto.SiteId.HasValue && dto.SiteId > 0)
            {
                var siteExists = await _context.Sites.AnyAsync(s => s.Id == dto.SiteId);
                if (!siteExists)
                    throw new KeyNotFoundException($"Site ID {dto.SiteId} does not exist.");
            }
            else
            {
                dto.SiteId = null;
            }

            existingQuote.CustomerId = dto.CustomerId;
            existingQuote.SiteId = dto.SiteId; 
            existingQuote.OpportunityId = dto.OpportunityId;

            existingQuote.Currency = dto.Currency;
            existingQuote.ExchangeRate = dto.ExchangeRate <= 0 ? 1 : dto.ExchangeRate;
            existingQuote.GlobalCommissionPct = dto.GlobalCommissionPct;
            existingQuote.GSTPercentage = dto.GSTPercentage;
            existingQuote.IncomeTaxPercentage = dto.IncomeTaxPercentage;
            existingQuote.Adjustment = dto.Adjustment;

            existingQuote.Items.Clear();
            await CalculateAndAddItemsAsync(existingQuote, dto.Items);

            await _quotationRepository.UpdateQuoteWithItemsAsync(id, existingQuote);

            if (oldGrandTotal != existingQuote.GrandTotal)
            {
                await _auditService.LogAsync(
                    userId,
                    "Quotation",
                    id,
                    "Price Update",
                    "Grand Total changed due to item updates.",
                    oldGrandTotal.ToString("N2"),
                    existingQuote.GrandTotal.ToString("N2")
                );
            }

            return await GetQuoteByIdAsync(id);
        }

        public async Task<QuotationDto?> GetQuoteByIdAsync(int id)
        {
            var quote = await _quotationRepository.GetQuoteWithItemsAsync(id);
            if (quote == null) return null;
            return MapToDto(quote);
        }

        public async Task<IEnumerable<QuotationDto>> GetAllQuotesAsync()
        {
            var quotes = await _quotationRepository.GetAllAsync();
            return quotes.Select(q => MapToDto(q)).ToList();
        }

        public async Task DeleteQuoteAsync(int id)
        {
            var quote = await _quotationRepository.GetQuoteWithItemsAsync(id);
            if (quote != null)
            {
                var userId = _currentUserService.UserId ?? "System";
                await _auditService.LogAsync(
                    userId,
                    "Quotation",
                    id,
                    "Delete",
                    $"Quotation {quote.QuoteNumber} deleted.",
                    quote.GrandTotal.ToString("N2"),
                    "0.00"
                );

                await _quotationRepository.DeleteQuoteWithItemsAsync(id);
            }
        }


        private async Task CalculateAndAddItemsAsync(Quotation quote, List<CreateQuotationItemDto> itemDtos)
        {
            decimal runningSubTotal = 0;

            if (itemDtos != null)
            {
                foreach (var itemDto in itemDtos)
                {
                    var product = await _context.Products.FindAsync(itemDto.ProductId);
                    if (product == null)
                    {
                        throw new Exception($"Product with ID {itemDto.ProductId} was not found in the database. Please check your inputs.");
                    }


                    string finalDescription = !string.IsNullOrEmpty(product.Description)
                                              ? product.Description
                                              : product.Name;

                    decimal costInQuoteCurrency = product.Price * quote.ExchangeRate;

                    decimal appliedCommission = itemDto.ManualCommissionPct ?? quote.GlobalCommissionPct;

                    decimal marginAmount = costInQuoteCurrency * (appliedCommission / 100);
                    decimal finalSellingPrice = costInQuoteCurrency + marginAmount;
                    decimal lineTotal = finalSellingPrice * itemDto.Quantity;

                    quote.Items.Add(new QuotationItem
                    {
                        ProductId = product.Id,

                        Description = finalDescription,

                        Quantity = itemDto.Quantity,
                        TenantId = _currentUserService.TenantId ?? 0,

                        UnitCost = costInQuoteCurrency,
                        MarginPercentage = appliedCommission,

                        UnitPrice = finalSellingPrice,
                        LineTotal = lineTotal
                    });

                    runningSubTotal += lineTotal;
                }
            }

            quote.SubTotal = runningSubTotal;
            quote.GSTAmount = quote.SubTotal * (quote.GSTPercentage / 100);
            quote.IncomeTaxAmount = quote.SubTotal * (quote.IncomeTaxPercentage / 100);
            quote.GrandTotal = quote.SubTotal + quote.GSTAmount + quote.IncomeTaxAmount + quote.Adjustment;
        }
        private QuotationDto MapToDto(Quotation q)
        {
            return new QuotationDto
            {
                Id = q.Id,
                QuoteNumber = q.QuoteNumber,
                CustomerId = q.CustomerId,
                CustomerName = q.Customer?.Name ?? "Unknown",
                SiteName = q.Site?.Name,
                ValidUntil = q.ValidUntil,
                Status = q.Status.ToString(),
                CreatedAt = q.CreatedAt,

                Currency = q.Currency,
                SubTotal = q.SubTotal,
                GSTPercentage = q.GSTPercentage,
                GSTAmount = q.GSTAmount,
                IncomeTaxPercentage = q.IncomeTaxPercentage,
                IncomeTaxAmount = q.IncomeTaxAmount,
                Adjustment = q.Adjustment,
                GrandTotal = q.GrandTotal,

                Items = q.Items?.Select(i => new QuotationItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId ?? 0,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    LineTotal = i.LineTotal
                }).ToList() ?? new List<QuotationItemDto>()
            };
        }
        public async Task<string> SubmitForApprovalAsync(int id)
        {
            var q = await _context.Quotations.FindAsync(id);
            if (q == null) throw new Exception("Not found");

            if (q.Status != QuotationStatus.Draft)
                throw new Exception("Only Drafts can be submitted.");

            q.Status = QuotationStatus.PendingApproval;
            await _context.SaveChangesAsync();
            
            // Notification Logic
            var submitterUserId = _currentUserService.UserId;
            var submitterName = "An Engineer";
            if (!string.IsNullOrEmpty(submitterUserId))
            {
                var submitter = await _userManager.FindByIdAsync(submitterUserId);
                if (submitter != null) submitterName = submitter.FullName;
            }

            var currentTenantId = _currentUserService.TenantId ?? 0;
            var admins = await _userManager.GetUsersInRoleAsync("Admin");
            var managers = await _userManager.GetUsersInRoleAsync("Manager");
            var recipients = admins.Concat(managers)
                                   .Where(u => u.TenantId == currentTenantId)
                                   .DistinctBy(u => u.Id)
                                   .ToList();
            
            var notificationTitle = "Quotation Submitted";
            var notificationMsg = $"{submitterName} submitted Quotation #{q.QuoteNumber} for approval.";

            foreach (var user in recipients)
            {
                // In-App Notification
                await _notificationService.CreateNotificationAsync(
                    userId: user.Id,
                    title: notificationTitle,
                    message: notificationMsg,
                    type: "Quotation",
                    targetId: q.Id
                );

                // Email Alert
                if (!string.IsNullOrEmpty(user.Email))
                {
                    try
                    {
                        await _emailService.SendEmailAsync(
                            user.Email,
                            notificationTitle,
                            $"<p>Hello {user.FullName},</p><p>{notificationMsg}</p><p>Please log in to the system to review and approve.</p>"
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to send email to {user.Email}: {ex.Message}");
                    }
                }
            }

            return "Quotation submitted for approval and alerts sent.";
        }

        public async Task<string> ApproveAsync(int id, string userId)
        {
            var q = await _context.Quotations
                .Include(q => q.Customer)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (q == null) throw new KeyNotFoundException("Quotation not found.");

            if (q.Status != QuotationStatus.PendingApproval)
                throw new Exception("Quotation is not pending approval.");

            var contentToSign = $"QUOTE-ID:{q.Id}|AMOUNT:{q.GrandTotal:N2}|DATE:{q.CreatedAt:yyyy-MM-dd}|USER:{userId}";

            try
            {
                await _digitalSignatureService.SignDocumentAsync(
                    "Quotation",
                    q.Id,
                    contentToSign,
                    userId
                );
            }
            catch (Exception ex)
            {
                throw new Exception($"Digital Signature Failed: {ex.Message}. Quote was not approved.");
            }

            q.Status = QuotationStatus.Approved;
            q.ApprovedByUserId = userId;
            q.ApprovedAt = DateTime.UtcNow;
            q.ReviewerComments = null;

            await _context.SaveChangesAsync();

            if (q.Customer != null && !string.IsNullOrEmpty(q.Customer.Email))
            {
                var customerEmail = q.Customer.Email;
                var customerName = q.Customer.Name;
                var quoteNum = q.QuoteNumber;
                var grandTotal = q.GrandTotal.ToString("N2");

                await _queue.QueueBackgroundWorkItemAsync(async (serviceProvider, token) =>
                {
                    
                    var emailService = serviceProvider.GetRequiredService<IEmailService>();

                    var emailBody = EmailTemplateBuilder.BuildApprovedTemplate(
                        customerName,
                        quoteNum,
                        grandTotal
                    );

                    await emailService.SendEmailAsync(
                        customerEmail,
                        $"Quotation #{quoteNum} Approved",
                        emailBody
                    );

                }, $"Email-Quote-{q.QuoteNumber}"); 
            }

            return "Quotation Approved, Signed, and Email Queued!";
        }
        public async Task<string> RejectAsync(int id, string comment)
        {
            var q = await _context.Quotations.FindAsync(id);

            if (q.Status != QuotationStatus.PendingApproval)
                throw new Exception("Quotation is not pending approval.");

            q.Status = QuotationStatus.Draft;
            q.ReviewerComments = comment;

            await _context.SaveChangesAsync();
            return "Quotation Rejected. Sent back to Draft.";
        }
        public async Task UpdateQuotationAsync(int id, UpdateQuotationRequest request)
        {
            var q = await _context.Quotations
                                  .Include(x => x.Items) 
                                  .FirstOrDefaultAsync(x => x.Id == id);

            if (q.Status != QuotationStatus.Draft && q.Status != QuotationStatus.Rejected)
                throw new InvalidOperationException("Cannot edit a locked Quotation.");

            
            q.CustomerId = request.CustomerId;
            q.ValidUntil = request.ValidUntil;
            q.Currency = request.Currency;
            q.SiteId = request.SiteId;

            
            q.GSTPercentage = request.GSTPercentage;
            q.IncomeTaxPercentage = request.IncomeTaxPercentage;
            q.Adjustment = request.Adjustment;

            _context.QuotationsItem.RemoveRange(q.Items);
            q.Items = request.Items.Select(i => new QuotationItem
            {
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                LineTotal = i.Quantity * i.UnitPrice
            }).ToList();

           

            decimal subTotal = q.Items.Sum(x => x.Quantity * x.UnitPrice);

            decimal gstAmount = (subTotal * q.GSTPercentage) / 100;
            decimal incomeTaxAmount = (subTotal * q.IncomeTaxPercentage) / 100;

            q.SubTotal = subTotal;
            q.GSTAmount = gstAmount;
            q.IncomeTaxAmount = incomeTaxAmount;
            q.GrandTotal = subTotal + gstAmount + incomeTaxAmount + q.Adjustment;

            await _context.SaveChangesAsync();
        }
        public async Task<int> CreateQuoteFromFailureAsync(ConvertFailureToQuoteDto dto, string userId)
        {
            var workOrder = await _context.WorkOrders
                .Include(w => w.CustomerId)
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.Id == dto.WorkOrderId);

            if (workOrder == null) throw new KeyNotFoundException("Work Order not found.");

            var quote = new Quotation
            {
                CustomerId = workOrder.CustomerId,
                QuoteNumber = $"Q-REP-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}",

                IssueDate = DateTime.UtcNow,
                ExpiryDate = DateTime.UtcNow.AddDays(7), 

                Status = QuotationStatus.Draft,

                Notes = $"Repair Quote generated from Inspection Failures in Job #{workOrder.JobNumber}",

                CreatedByUserId = userId,
                TenantId = workOrder.TenantId
            };

            decimal runningTotal = 0;

            foreach (var item in dto.Items)
            {
                var lineTotal = item.Quantity * item.UnitPrice;

                quote.Items.Add(new QuotationItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    LineTotal = lineTotal,
                    Description = item.Description 
                });

                runningTotal += lineTotal;
            }

            quote.GrandTotal = runningTotal;

            _context.Quotations.Add(quote);
            await _context.SaveChangesAsync();

            return quote.Id;
        }

    }
    
}