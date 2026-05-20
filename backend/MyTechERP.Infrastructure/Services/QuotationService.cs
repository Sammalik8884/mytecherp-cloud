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
using MytechERP.domain.Entities.Finance;

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

            string quoteNumber;
            int revisionNumber = 0;
            string projectCode = string.IsNullOrWhiteSpace(dto.ProjectCode) ? "FPS" : dto.ProjectCode;

            if (dto.ReviseQuoteId.HasValue && dto.ReviseQuoteId.Value > 0)
            {
                var baseQuote = await _context.Quotations.FindAsync(dto.ReviseQuoteId.Value);
                if (baseQuote == null) throw new Exception("Base quote not found for revision.");

                string baseNumber = baseQuote.QuoteNumber;
                int lastDashIndex = baseNumber.LastIndexOf("-R");
                if (lastDashIndex > 0)
                {
                    baseNumber = baseNumber.Substring(0, lastDashIndex);
                }

                var parts = baseNumber.Split('-');
                if (parts.Length == 3)
                {
                    baseNumber = $"{parts[0]}-{parts[1]}-{projectCode}";
                }

                var existingRevisions = await _context.Quotations
                    .Where(q => q.QuoteNumber.StartsWith(parts[0] + "-" + parts[1] + "-") && q.QuoteNumber.Contains("-R"))
                    .Select(q => q.RevisionNumber)
                    .ToListAsync();
                
                revisionNumber = existingRevisions.Any() ? existingRevisions.Max() + 1 : 1;
                quoteNumber = $"{baseNumber}-R{revisionNumber}";
            }
            else
            {
                int nextSeq = 1;
                var lastQuote = await _context.Quotations
                    .Where(q => q.QuoteNumber.StartsWith("MTQ-"))
                    .OrderByDescending(q => q.Id)
                    .FirstOrDefaultAsync();
                if (lastQuote != null)
                {
                    var parts = lastQuote.QuoteNumber.Split('-');
                    if (parts.Length >= 2)
                    {
                        string seqPart = parts[1];
                        if (seqPart.Length >= 3 && char.IsLetter(seqPart[0]) && char.IsLetter(seqPart[1]))
                        {
                            int letterVal = (seqPart[0] - 'A') * 26 + (seqPart[1] - 'A');
                            if (int.TryParse(seqPart.Substring(2), out int numPart))
                                nextSeq = letterVal * 100000 + numPart + 1;
                        }
                        else if (int.TryParse(seqPart, out int parsed))
                        {
                            nextSeq = parsed + 1;
                        }
                    }
                }
                int letterGroup = (nextSeq - 1) / 100000;
                int digitPart = ((nextSeq - 1) % 100000) + 1;
                char c1 = (char)('A' + (letterGroup / 26));
                char c2 = (char)('A' + (letterGroup % 26));
                string alphaSeq = $"{c1}{c2}{digitPart:D5}";

                quoteNumber = $"MTQ-{alphaSeq}-{projectCode}-R0";
            }

            // Auto-generate headline if not provided
            string headline = dto.QuoteHeadline;
            if (string.IsNullOrWhiteSpace(headline))
            {
                var modes = (dto.QuoteMode ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries).Select(m => m.Trim()).ToList();
                if (modes.Contains("Imported") && modes.Contains("Local") && modes.Contains("Services"))
                    headline = "Supply & Installation";
                else if (modes.Contains("Imported") && modes.Contains("Services"))
                    headline = "Supply (Imported) & Services";
                else if (modes.Contains("Local") && modes.Contains("Services"))
                    headline = "Supply (Local) & Services";
                else if (modes.Contains("Imported") && modes.Contains("Local"))
                    headline = "Supply (Imported + Local)";
                else if (modes.Contains("Imported"))
                    headline = "Supply (Imported)";
                else if (modes.Contains("Local"))
                    headline = "Supply (Local)";
                else if (modes.Contains("Services"))
                    headline = "Services Only";
                else
                    headline = "Quotation";
            }

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
                ProvincialTaxType = dto.ProvincialTaxType,
                ProvincialTaxPercentage = dto.ProvincialTaxPercentage,
                Adjustment = dto.Adjustment,
                CreatedByUserId= _currentUserService.UserId,
                QuoteMode = dto.QuoteMode,
                SupplyColumnMode = dto.SupplyColumnMode,
                RevisionNumber = revisionNumber,
                ProjectCode = projectCode,
                QuoteHeadline = headline
            };

            await CalculateAndAddItemsAsync(quotation, dto);

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

            if (quotation.OpportunityId.HasValue)
            {
                var lead = await _context.SalesLeads.FindAsync(quotation.OpportunityId.Value);
                if (lead != null)
                {
                    lead.QuotationId = quotation.Id;
                    lead.Status = LeadStatus.ConvertedToQuotation;
                    await _context.SaveChangesAsync();
                }
            }

            return await GetQuoteByIdAsync(quotation.Id);
        }

        public async Task<QuotationDto> UpdateQuoteAsync(int id, CreateQuotationDto dto)
        {
            var existingQuote = await _quotationRepository.GetQuoteWithItemsAsync(id);
            if (existingQuote == null) throw new Exception($"Quotation {id} not found");

            if (dto.ReviseQuoteId.HasValue && dto.ReviseQuoteId.Value == id)
            {
                existingQuote.RevisionNumber += 1;
                
                string baseNumber = existingQuote.QuoteNumber;
                int lastDashIndex = baseNumber.LastIndexOf("-R");
                if (lastDashIndex > 0)
                {
                    baseNumber = baseNumber.Substring(0, lastDashIndex);
                }
                
                existingQuote.QuoteNumber = $"{baseNumber}-R{existingQuote.RevisionNumber}";
            }

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
            existingQuote.ProvincialTaxType = dto.ProvincialTaxType;
            existingQuote.ProvincialTaxPercentage = dto.ProvincialTaxPercentage;
            existingQuote.Adjustment = dto.Adjustment;

            existingQuote.QuoteMode = dto.QuoteMode;
            existingQuote.SupplyColumnMode = dto.SupplyColumnMode;
            existingQuote.QuoteHeadline = dto.QuoteHeadline;

            var newItems = await CalculateItemsAsync(existingQuote, dto);

            // Match and Update existing items to preserve IDs (for invoice tracking)
            var existingItems = existingQuote.Items.ToList();
            
            // 1. Remove items no longer in the new list
            foreach (var oldItem in existingItems)
            {
                if (!newItems.Any(n => n.Description == oldItem.Description && n.ItemType == oldItem.ItemType))
                {
                    existingQuote.Items.Remove(oldItem);
                }
            }

            // 2. Update existing or add new
            foreach (var newItem in newItems)
            {
                var match = existingQuote.Items.FirstOrDefault(o => o.Description == newItem.Description && o.ItemType == newItem.ItemType);
                if (match != null)
                {
                    // Update properties
                    match.Quantity = newItem.Quantity;
                    match.UnitPrice = newItem.UnitPrice;
                    match.LineTotal = newItem.LineTotal;
                    match.UnitCost = newItem.UnitCost;
                    match.MarginPercentage = newItem.MarginPercentage;
                    match.OriginalPrice = newItem.OriginalPrice;
                    match.CalculationBreakdown = newItem.CalculationBreakdown;
                    match.Unit = newItem.Unit;
                    match.UnitQty = newItem.UnitQty;
                    match.ProductId = newItem.ProductId;
                    match.ServiceName = newItem.ServiceName;
                }
                else
                {
                    existingQuote.Items.Add(newItem);
                }
            }

            // Recalculate totals
            RecalculateTotals(existingQuote);

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
            
            var dto = MapToDto(quote);
            
            // Calculate Invoiced quantities
            var invoicedQuantities = await _context.Invoices
                .Where(i => i.QuotationId == id && i.Status != InvoiceStatus.Cancelled)
                .SelectMany(i => i.Items)
                .Where(i => i.QuotationItemId != null)
                .GroupBy(i => i.QuotationItemId.Value)
                .Select(g => new { QuotationItemId = g.Key, InvoicedQty = g.Sum(x => x.Quantity) })
                .ToDictionaryAsync(x => x.QuotationItemId, x => x.InvoicedQty);
                
            foreach (var item in dto.Items)
            {
                if (invoicedQuantities.TryGetValue(item.Id, out var invoicedQty))
                {
                    item.InvoicedQuantity = invoicedQty;
                    item.IsFullyInvoiced = invoicedQty >= item.Quantity;
                }
            }
            
            return dto;
        }

        public async Task<IEnumerable<QuotationDto>> GetAllQuotesAsync()
        {
            var userId = _currentUserService.UserId;
            var userEmail = _currentUserService.Email;
            var userRoles = _currentUserService.Roles?.ToList() ?? new List<string>();

            bool isAdminOrHuzefa = userRoles.Contains("Admin")
                || string.Equals(userEmail, "m.huzefa@mytecheng.com", StringComparison.OrdinalIgnoreCase);

            var allQuotes = await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Items)
                .OrderByDescending(q => q.Id)
                .ToListAsync();

            IEnumerable<Quotation> filtered;

            if (isAdminOrHuzefa)
            {
                filtered = allQuotes;
            }
            else if (userRoles.Contains("Salesman"))
            {
                // Salesmen see quotations created for their leads
                var myLeadQuoteIds = await _context.SalesLeads
                    .Where(l => l.SalesmanUserId == userId && l.QuotationId != null)
                    .Select(l => l.QuotationId!.Value)
                    .ToListAsync();

                filtered = allQuotes.Where(q =>
                    q.CreatedByUserId == userId ||
                    myLeadQuoteIds.Contains(q.Id));
            }
            else
            {
                // Engineers, Estimators, others: only quotations they created
                filtered = allQuotes.Where(q => q.CreatedByUserId == userId);
            }

            return filtered.Select(q => MapToDto(q)).ToList();
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

                // Clear any sales leads referencing this quotation so they revert to "Ready for Quote"
                var linkedLeads = await _context.SalesLeads
                    .Where(l => l.QuotationId == id)
                    .ToListAsync();
                foreach (var lead in linkedLeads)
                {
                    lead.QuotationId = null;
                    lead.Status = LeadStatus.Closed; // Shows as "Ready for Quote" in the UI
                }
                if (linkedLeads.Any())
                    await _context.SaveChangesAsync();

                await _quotationRepository.DeleteQuoteWithItemsAsync(id);
            }
        }


        private void RecalculateTotals(Quotation quote)
        {
            quote.SubTotal = quote.Items.Sum(x => x.LineTotal);
            
            var suppliesTotal = quote.Items
                .Where(x => x.ItemType == ItemType.Imported || x.ItemType == ItemType.Local)
                .Sum(x => x.LineTotal);

            var servicesTotal = quote.Items
                .Where(x => x.ItemType == ItemType.Service || x.ItemType == ItemType.ImportedService || x.ItemType == ItemType.LocalService)
                .Sum(x => x.LineTotal);

            quote.GSTAmount = suppliesTotal * (quote.GSTPercentage / 100m);
            quote.IncomeTaxAmount = suppliesTotal * (quote.IncomeTaxPercentage / 100m);
            quote.ProvincialTaxAmount = servicesTotal * (quote.ProvincialTaxPercentage / 100m);
            quote.GrandTotal = quote.SubTotal + quote.GSTAmount + quote.IncomeTaxAmount + quote.ProvincialTaxAmount + quote.Adjustment;
        }

        private async Task<List<QuotationItem>> CalculateItemsAsync(Quotation quote, CreateQuotationDto dto)
        {
            var items = new List<QuotationItem>();
            var tenantId = _currentUserService.TenantId ?? 0;
            
            decimal costFactorPct = dto.CostFactorPct > 0 ? dto.CostFactorPct : 60m;
            decimal importationPct = dto.ImportationPct > 0 ? dto.ImportationPct : 13.75m;
            decimal transportationPct = dto.TransportationPct > 0 ? dto.TransportationPct : 2m;
            decimal profitPct = dto.ProfitPct > 0 ? dto.ProfitPct : 15m;
            decimal exchangeRate = quote.ExchangeRate;
            
            if (dto.Items != null)
            {
                foreach (var itemDto in dto.Items)
                {
                    decimal unitCost = 0;
                    decimal finalSellingPrice = 0;
                    decimal originalPrice = 0;
                    string finalDescription = "";
                    string calcBreakdown = null;
                    ItemType parsedType = ItemType.Local;
                    if (Enum.TryParse<ItemType>(itemDto.ItemType, out var t)) parsedType = t;

                    if (parsedType == ItemType.Service || parsedType == ItemType.ImportedService || parsedType == ItemType.LocalService)
                    {
                        finalDescription = itemDto.ServiceName ?? "Custom Service";
                        originalPrice = itemDto.ServicePrice ?? 0;
                        finalSellingPrice = originalPrice;
                        unitCost = finalSellingPrice;
                    }
                    else
                    {
                        var product = itemDto.ProductId.HasValue && itemDto.ProductId.Value > 0
                            ? await _context.Products.FindAsync(itemDto.ProductId.Value)
                            : null;

                        if (product != null)
                        {
                            if (!string.IsNullOrWhiteSpace(itemDto.ServiceName))
                                finalDescription = itemDto.ServiceName;
                            else
                                finalDescription = !string.IsNullOrEmpty(product.Description) ? product.Description : product.Name;
                        }
                        else
                        {
                            finalDescription = !string.IsNullOrWhiteSpace(itemDto.ServiceName) ? itemDto.ServiceName : "Custom Item";
                        }

                        if (itemDto.OverridePrice.HasValue && itemDto.OverridePrice.Value > 0)
                        {
                            originalPrice = itemDto.OverridePrice.Value;
                        }
                        else if (product != null)
                        {
                            originalPrice = (product.PriceAED.HasValue && product.PriceAED.Value > 0) ? product.PriceAED.Value : product.Price;
                        }

                        if (parsedType == ItemType.Imported)
                        {
                            if (originalPrice > 0)
                            {
                                decimal costPricePKR = originalPrice * exchangeRate;
                                decimal negotiatedCost = costPricePKR * (costFactorPct / 100m);
                                decimal importationCharge = negotiatedCost * (importationPct / 100m);
                                decimal transportationCharge = negotiatedCost * (transportationPct / 100m);
                                decimal profitCharge = negotiatedCost * (profitPct / 100m);
                                
                                finalSellingPrice = negotiatedCost + importationCharge + transportationCharge + profitCharge;
                                unitCost = negotiatedCost;
                                
                                calcBreakdown = System.Text.Json.JsonSerializer.Serialize(new {
                                    originalPrice = originalPrice,
                                    exchangeRate = exchangeRate,
                                    costPricePKR = costPricePKR,
                                    costFactorPct = costFactorPct,
                                    negotiatedCost = negotiatedCost,
                                    importationPct = importationPct,
                                    importationCharge = importationCharge,
                                    transportationPct = transportationPct,
                                    transportationCharge = transportationCharge,
                                    profitPct = profitPct,
                                    profitCharge = profitCharge,
                                    finalPrice = finalSellingPrice
                                });
                            }
                        }
                        else // Local
                        {
                            decimal costInQuoteCurrency = originalPrice;
                            decimal appliedCommission = itemDto.ManualCommissionPct ?? quote.GlobalCommissionPct;
                            decimal marginAmount = costInQuoteCurrency * (appliedCommission / 100m);
                            finalSellingPrice = costInQuoteCurrency + marginAmount;
                            unitCost = costInQuoteCurrency;
                        }
                    }

                    if (itemDto.FinalPriceOverride.HasValue)
                    {
                        finalSellingPrice = itemDto.FinalPriceOverride.Value;
                    }

                    decimal lineTotal = finalSellingPrice * itemDto.Quantity;

                    items.Add(new QuotationItem
                    {
                        ProductId = (parsedType == ItemType.Service || parsedType == ItemType.ImportedService || parsedType == ItemType.LocalService) ? null : itemDto.ProductId,
                        Description = finalDescription,
                        Quantity = itemDto.Quantity,
                        TenantId = tenantId,
                        UnitCost = unitCost,
                        MarginPercentage = parsedType == ItemType.Local ? (itemDto.ManualCommissionPct ?? quote.GlobalCommissionPct) : profitPct,
                        UnitPrice = finalSellingPrice,
                        LineTotal = lineTotal,
                        ItemType = parsedType,
                        ServiceName = itemDto.ServiceName,
                        OriginalPrice = originalPrice,
                        CalculationBreakdown = calcBreakdown,
                        Unit = itemDto.Unit,
                        UnitQty = itemDto.UnitQty
                    });
                }
            }
            return items;
        }

        private async Task CalculateAndAddItemsAsync(Quotation quote, CreateQuotationDto dto)
        {
            var items = await CalculateItemsAsync(quote, dto);
            foreach (var item in items)
            {
                quote.Items.Add(item);
            }
            RecalculateTotals(quote);
        }
        private QuotationDto MapToDto(Quotation q)
        {
            return new QuotationDto
            {
                Id = q.Id,
                QuoteNumber = q.QuoteNumber,
                CustomerId = q.CustomerId,
                CustomerName = q.Customer?.Name ?? "Unknown",
                ContactPersonName = q.Customer?.ContactPersonName,
                SiteName = q.Site?.Name,
                ValidUntil = q.ValidUntil,
                Status = q.Status.ToString(),
                CreatedAt = q.CreatedAt,
                QuoteMode = q.QuoteMode,
                SupplyColumnMode = q.SupplyColumnMode,

                Currency = q.Currency,
                SubTotal = q.SubTotal,
                GSTPercentage = q.GSTPercentage,
                GSTAmount = q.GSTAmount,
                IncomeTaxPercentage = q.IncomeTaxPercentage,
                IncomeTaxAmount = q.IncomeTaxAmount,
                ProvincialTaxType = q.ProvincialTaxType,
                ProvincialTaxPercentage = q.ProvincialTaxPercentage,
                ProvincialTaxAmount = q.ProvincialTaxAmount,
                Adjustment = q.Adjustment,
                GrandTotal = q.GrandTotal,

                RevisionNumber = q.RevisionNumber,
                ProjectCode = q.ProjectCode,
                QuoteHeadline = q.QuoteHeadline,

                Items = q.Items?.Select(i => new QuotationItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId ?? 0,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    LineTotal = i.LineTotal,
                    ItemType = i.ItemType.ToString(),
                    ServiceName = i.ServiceName,
                    OriginalPrice = i.OriginalPrice,
                    CalculationBreakdown = i.CalculationBreakdown,
                    Unit = i.Unit,
                    UnitQty = i.UnitQty
                }).ToList() ?? new List<QuotationItemDto>()
            };
        }
        public async Task<string> SubmitForApprovalAsync(int id)
        {
            var q = await _context.Quotations.FindAsync(id);
            if (q == null) throw new Exception("Not found");

            if (q.Status != QuotationStatus.Draft)
                throw new Exception("Only Drafts can be submitted.");

            var userRoles = _currentUserService.Roles?.ToList() ?? new List<string>();
            var submitterUserId = _currentUserService.UserId;
            var submitterName = "An Engineer";
            if (!string.IsNullOrEmpty(submitterUserId))
            {
                var submitter = await _userManager.FindByIdAsync(submitterUserId);
                if (submitter != null) submitterName = submitter.FullName;
            }

            // Manager bypass: auto-approve without going through Huzefa
            if (userRoles.Contains("Manager"))
            {
                q.Status = QuotationStatus.Approved;
                q.ApprovedByUserId = submitterUserId;
                q.ApprovedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return "Quotation auto-approved by manager.";
            }

            q.Status = QuotationStatus.PendingApproval;
            await _context.SaveChangesAsync();

            var currentTenantId = _currentUserService.TenantId ?? 0;
            
            // Route all quotation approvals strictly to M.Huzefa
            var huzefaUser = await _userManager.FindByEmailAsync("m.huzefa@mytecheng.com");
            var recipients = new List<AppUser>();
            if (huzefaUser != null && huzefaUser.TenantId == currentTenantId)
            {
                recipients.Add(huzefaUser);
            }
            
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

            if (q.Customer != null)
            {
                q.Customer.IsProspect = false;
            }

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
            q.ProvincialTaxType = request.ProvincialTaxType;
            q.ProvincialTaxPercentage = request.ProvincialTaxPercentage;
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
            
            // Note: Since ItemType is lost in UpdateQuotationRequest DTO, we assume all are supplies here.
            // This endpoint is rarely used or legacy.
            decimal suppliesTotal = subTotal;
            decimal servicesTotal = subTotal; // Fallback, normally they are mutually exclusive or properly tracked

            decimal gstAmount = (suppliesTotal * q.GSTPercentage) / 100;
            decimal incomeTaxAmount = (suppliesTotal * q.IncomeTaxPercentage) / 100;
            decimal provincialTaxAmount = (servicesTotal * q.ProvincialTaxPercentage) / 100;

            q.SubTotal = subTotal;
            q.GSTAmount = gstAmount;
            q.IncomeTaxAmount = incomeTaxAmount;
            q.ProvincialTaxAmount = provincialTaxAmount;
            q.GrandTotal = subTotal + gstAmount + incomeTaxAmount + provincialTaxAmount + q.Adjustment;

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