using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Infrastructure.Persistance;
using MyTechERP.Infrastructure.PDF;
using QuestPDF.Fluent;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class ComplianceController : Controller
    {
            private readonly ApplicationDbContext _context;

            public ComplianceController(ApplicationDbContext context)
            {
                _context = context;
            }

            [HttpGet("certificate/{quoteId}")]
            [Microsoft.AspNetCore.Authorization.Authorize(Roles = MytechERP.domain.Roles.Roles.Admin + "," + MytechERP.domain.Roles.Roles.Manager + "," + MytechERP.domain.Roles.Roles.Customers)]
            public async Task<IActionResult> DownloadCertificate(int quoteId)
            {
                var quote = await _context.Quotations
                    .FirstOrDefaultAsync(q => q.Id == quoteId);

                if (quote == null) return NotFound("Quotation not found");

                var signature = await _context.DocumentSignatures
                    .OrderByDescending(s => s.SignedAt)
                    .FirstOrDefaultAsync(s => s.EntityName == "Quotation" && s.EntityId == quoteId);

                if (signature == null) return BadRequest("This quotation has not been digitally signed yet.");

                var document = new ComplianceCertificate(quote, signature);
                var pdfBytes = document.GeneratePdf();

                return File(pdfBytes, "application/pdf", $"Certificate-{quote.QuoteNumber}.pdf");
            }
        }
    }

