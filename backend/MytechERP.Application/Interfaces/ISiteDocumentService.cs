using Microsoft.AspNetCore.Http;
using MytechERP.Application.DTOs.CRM;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface ISiteDocumentService
    {
        Task<IEnumerable<SiteDocumentDto>> GetDocumentsBySiteIdAsync(int siteId);
        Task<IEnumerable<SiteDocumentDto>> UploadDocumentsAsync(int siteId, string documentType, int? customerId, int? secondaryCustomerId, List<IFormFile> files);
        Task DeleteDocumentAsync(int documentId);
    }
}
