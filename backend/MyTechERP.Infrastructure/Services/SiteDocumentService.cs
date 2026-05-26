using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class SiteDocumentService : ISiteDocumentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBlobService _blobService;
        private readonly ICurrentUserService _currentUserService;

        public SiteDocumentService(ApplicationDbContext context, IBlobService blobService, ICurrentUserService currentUserService)
        {
            _context = context;
            _blobService = blobService;
            _currentUserService = currentUserService;
        }

        public async Task<IEnumerable<SiteDocumentDto>> GetDocumentsBySiteIdAsync(int siteId)
        {
            var documents = await _context.SiteDocuments
                .Include(d => d.Site)
                .Include(d => d.Customer)
                .Include(d => d.SecondaryCustomer)
                .Where(d => d.SiteId == siteId && !d.IsDeleted)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            return documents.Select(d => new SiteDocumentDto
            {
                Id = d.Id,
                SiteId = d.SiteId,
                SiteName = d.Site?.Name ?? "",
                DocumentType = d.DocumentType,
                CustomerId = d.CustomerId,
                CustomerName = d.Customer?.Name,
                SecondaryCustomerId = d.SecondaryCustomerId,
                SecondaryCustomerName = d.SecondaryCustomer?.Name,
                FileName = d.FileName,
                FileUrl = _blobService.GenerateSasUrl(d.FileUrl),
                CreatedAt = d.CreatedAt,
                UploadedByUserId = d.UploadedByUserId
            });
        }

        public async Task<IEnumerable<SiteDocumentDto>> UploadDocumentsAsync(int siteId, string documentType, int? customerId, int? secondaryCustomerId, List<IFormFile> files)
        {
            var uploadedDocuments = new List<SiteDocument>();
            var userId = _currentUserService.UserId ?? "";

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    string fileExtension = Path.GetExtension(file.FileName);
                    string fileName = $"sitedocs/{siteId}/{Guid.NewGuid()}{fileExtension}";

                    var url = await _blobService.UploadAsync(file, fileName);

                    var doc = new SiteDocument
                    {
                        SiteId = siteId,
                        DocumentType = documentType,
                        CustomerId = customerId,
                        SecondaryCustomerId = secondaryCustomerId,
                        FileName = file.FileName,
                        FileUrl = url,
                        UploadedByUserId = userId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.SiteDocuments.Add(doc);
                    uploadedDocuments.Add(doc);
                }
            }

            await _context.SaveChangesAsync();

            return uploadedDocuments.Select(d => new SiteDocumentDto
            {
                Id = d.Id,
                SiteId = d.SiteId,
                DocumentType = d.DocumentType,
                CustomerId = d.CustomerId,
                SecondaryCustomerId = d.SecondaryCustomerId,
                FileName = d.FileName,
                FileUrl = _blobService.GenerateSasUrl(d.FileUrl),
                CreatedAt = d.CreatedAt,
                UploadedByUserId = d.UploadedByUserId
            });
        }

        public async Task DeleteDocumentAsync(int documentId)
        {
            var doc = await _context.SiteDocuments.FindAsync(documentId);
            if (doc != null)
            {
                doc.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }
    }
}
