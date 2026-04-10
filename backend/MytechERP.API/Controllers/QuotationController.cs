using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.DTOs.Quotations;
using MytechERP.Application.DTOs.sales;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Enums;
using MytechERP.domain.Roles;
using MytechERP.Infrastructure.Persistance;
using MyTechERP.Infrastructure.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QuotationController : ControllerBase
    {
        private readonly IQuotationService _service;
        private readonly IQuotationConversionService _conversionService;
        private readonly IEmailService _emailService;
        private readonly QuotationPdfService _quotationPdfService;
        private ApplicationDbContext _context;

        public QuotationController(IQuotationService service, IQuotationConversionService conversionService,IEmailService emailService, QuotationPdfService quotationPdfService, ApplicationDbContext context)
        {
            _service = service;
            _conversionService = conversionService;
            _emailService = emailService;
            _quotationPdfService  = quotationPdfService;
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<IActionResult> GetAll()
        {
            var data = await _service.GetAllQuotesAsync();
            return Ok(data);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<IActionResult> GetById(int id)
        {
            var quote = await _service.GetQuoteByIdAsync(id);
            if (quote == null)
            {
                return NotFound(new { Message = $"Quotation with ID {id} not found." });
            }
            return Ok(quote);
        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<IActionResult> Create([FromBody] CreateQuotationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var result = await _service.CreateQuoteAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<IActionResult> Update(int id, [FromBody] CreateQuotationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var updatedQuote = await _service.UpdateQuoteAsync(id, dto);

                if (updatedQuote == null)
                    return NotFound(new { Message = "Quotation not found." });

                return Ok(updatedQuote);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.DeleteQuoteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                var isConstraintError = ex.InnerException?.Message.Contains("REFERENCE constraint") == true || 
                                        ex.Message.Contains("REFERENCE constraint") ||
                                        ex.InnerException?.Message.Contains("foreign key") == true ||
                                        ex.Message.Contains("foreign key");
                
                if (isConstraintError || ex is DbUpdateException)
                {
                    return BadRequest(new { Error = "Cannot delete this quotation because it has linked records (e.g. converted work orders, invoices, or contracts). Please delete or reassign those associated records first." });
                }

                return StatusCode(500, new { Error = "Server Error: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }
        [HttpGet("{id}/pdf")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Customers + "," + Roles.Estimation + "," + Roles.Salesman)]
        public async Task<IActionResult> DownloadPdf(int id)
        {
            try
            {
                var quoteDto = await _service.GetQuoteByIdAsync(id);
                if (quoteDto == null) return NotFound(new { Message = "Quotation not found" });

                var pdfFileBytes = _quotationPdfService.GeneratePdf(quoteDto);

                string fileName = $"{quoteDto.QuoteNumber}.pdf";
                return File(pdfFileBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PDF GENERATION ERROR for ID {id}: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new { Error = "Failed to generate PDF.", Details = ex.Message });
            }
        }
        [HttpPost("{id}/submit")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<IActionResult> Submit(int id)
        {
            return Ok(await _service.SubmitForApprovalAsync(id));
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)] 
        public async Task<IActionResult> Approve(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Ok(await _service.ApproveAsync(id, userId));
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)] 
        public async Task<IActionResult> Reject(int id, [FromBody] string comment)
        {
            return Ok(await _service.RejectAsync(id, comment));
        }
        [HttpPost("{id}/convert-to-workorder")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<IActionResult> ConvertToWorkOrder(int id)
        {
            try
            {
                var workOrderId = await _conversionService.ConvertToWorkOrderAsync(id);
                return Ok(new { Message = "Converted to Work Order successfully", WorkOrderId = workOrderId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("{id}/convert-to-contract")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Estimation)]
        public async Task<IActionResult> ConvertToContract(int id, [FromQuery] DateTime startDate)
        {
            try
            {
                if (startDate == default) startDate = DateTime.UtcNow;

                var contractId = await _conversionService.ConvertToContractAsync(id, startDate, 12);
                return Ok(new { Message = "Converted to AMC Contract successfully", ContractId = contractId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
        [HttpPost("{id}/send-email")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager)]
        public async Task<IActionResult> SendQuotationEmail(int id)
        {
           

            var quote = await _context.Quotations
                .Include(q => q.Items)
                .Include(q => q.Customer)
                .Include(q => q.Site)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quote == null) return NotFound(new { Error = "Quotation not found." });
            if (string.IsNullOrEmpty(quote.Customer?.Email)) return BadRequest(new { Error = "Customer has no email address." });
            if (quote.Status != QuotationStatus.Approved && quote.Status != QuotationStatus.SentToCustomer && quote.Status != QuotationStatus.Converted)
                return BadRequest(new { Error = "Cannot send Email. Quotation must be 'Approved' first." });

            var quoteDto = new QuotationDto
            {
                QuoteNumber = quote.QuoteNumber,
                CreatedAt = quote.CreatedAt,
                ValidUntil = quote.ValidUntil,
                CustomerName = quote.Customer.Name,
                SiteName = quote.Site?.Name,
                Currency = quote.Currency,
                Items = quote.Items.Select(i => new QuotationItemDto
                {
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    LineTotal = i.LineTotal
                }).ToList(),
                SubTotal = quote.SubTotal,
                GSTPercentage = quote.GSTPercentage,
                GSTAmount = quote.GSTAmount,
                IncomeTaxPercentage = quote.IncomeTaxPercentage,
                IncomeTaxAmount = quote.IncomeTaxAmount,
                GrandTotal = quote.GrandTotal
            };

            var pdfBytes = _quotationPdfService.GeneratePdf(quoteDto);

            var subject = $"Quotation #{quote.QuoteNumber} from MyTech Engineering";
            var body = $@"
        <h3>Dear {quote.Customer.Name},</h3>
        <p>Please find attached the quotation <strong>#{quote.QuoteNumber}</strong> for your review.</p>
        <p><strong>Total Amount:</strong> {quote.GrandTotal:N2} {quote.Currency}</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <br/>
        <p>Best Regards,<br/>MyTech Engineering Team</p>";

            await _emailService.SendEmailWithAttachmentAsync(quote.Customer.Email, subject, body, pdfBytes, $"Quote-{quote.QuoteNumber}.pdf");

            quote.Status = QuotationStatus.SentToCustomer; 
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Email sent successfully to {quote.Customer.Email}" });
        }
        [HttpPost("create-from-failure")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer)]
        public async Task<IActionResult> CreateFromFailure([FromBody] ConvertFailureToQuoteDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var quoteId = await _service.CreateQuoteFromFailureAsync(dto, userId);

                return Ok(new
                {
                    Message = "Repair Quote Created Successfully",
                    QuoteId = quoteId,
                    NextStep = $"/quotations/edit/{quoteId}" 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

    }
