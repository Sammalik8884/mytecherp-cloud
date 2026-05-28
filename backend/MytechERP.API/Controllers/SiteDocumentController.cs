using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MytechERP.Application.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SiteDocumentController : ControllerBase
    {
        private readonly ISiteDocumentService _siteDocumentService;

        public SiteDocumentController(ISiteDocumentService siteDocumentService)
        {
            _siteDocumentService = siteDocumentService;
        }

        [HttpGet("site/{siteId}")]
        public async Task<IActionResult> GetDocuments(int siteId)
        {
            var docs = await _siteDocumentService.GetDocumentsBySiteIdAsync(siteId);
            return Ok(docs);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllDocuments()
        {
            var docs = await _siteDocumentService.GetAllDocumentsAsync();
            return Ok(docs);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocuments([FromForm] int siteId, [FromForm] string documentType, [FromForm] int? customerId, [FromForm] int? secondaryCustomerId, [FromForm] List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest("No files uploaded.");
            }

            var docs = await _siteDocumentService.UploadDocumentsAsync(siteId, documentType, customerId, secondaryCustomerId, files);
            return Ok(docs);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            await _siteDocumentService.DeleteDocumentAsync(id);
            return NoContent();
        }
    }
}
