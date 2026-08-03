using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using MytechERP.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class BlobService : IBlobService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName = "evidence-vault";

        public BlobService(IConfiguration configuration)
        {
            string connectionString = configuration.GetConnectionString("AzureStorage");
            // Force older API version compatibility for local Azurite / Azure Storage Emulators
            var options = new BlobClientOptions(BlobClientOptions.ServiceVersion.V2020_12_06);
            _blobServiceClient = new BlobServiceClient(connectionString, options);
        }

        public async Task<string> UploadAsync(IFormFile file, string fileName)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);

            try
            {
                await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);
            }
            catch (Azure.RequestFailedException ex) when (ex.ErrorCode == "PublicAccessNotPermitted")
            {
                await containerClient.CreateIfNotExistsAsync();
            }
            catch (Azure.RequestFailedException ex) when (ex.Status == 409 || ex.ErrorCode == "ContainerAlreadyExists" || ex.Message.Contains("already exists"))
            {
                // Container already exists, ignore
            }

            var blobClient = containerClient.GetBlobClient(fileName);


            using (var stream = file.OpenReadStream())
            {
                var safeFileName = file.FileName.Replace("\"", "\\\"");
                var blobHttpHeaders = new BlobHttpHeaders { 
                    ContentType = file.ContentType,
                    ContentDisposition = $"attachment; filename=\"{safeFileName}\""
                };
                await blobClient.UploadAsync(stream, new BlobUploadOptions { HttpHeaders = blobHttpHeaders });
            }

            return blobClient.Uri.ToString();
        }

        public async Task<string> UploadStreamAsync(System.IO.Stream stream, string fileName, string contentType)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            try
            {
                await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);
            }
            catch (Azure.RequestFailedException ex) when (ex.ErrorCode == "PublicAccessNotPermitted")
            {
                await containerClient.CreateIfNotExistsAsync();
            }
            catch (Azure.RequestFailedException ex) when (ex.Status == 409 || ex.ErrorCode == "ContainerAlreadyExists" || ex.Message.Contains("already exists"))
            {
                // Container already exists, ignore
            }
            var blobClient = containerClient.GetBlobClient(fileName);

            var blobHttpHeaders = new BlobHttpHeaders { ContentType = contentType };
            await blobClient.UploadAsync(stream, new BlobUploadOptions { HttpHeaders = blobHttpHeaders });

            return blobClient.Uri.ToString();
        }
        public string GenerateSasUrl(string rawBlobUrl, int expiryMinutes = 60, bool isDownload = false)
        {
            if (string.IsNullOrEmpty(rawBlobUrl)) return rawBlobUrl;
            
            try
            {
                var uri = new Uri(rawBlobUrl);
                
                string prefix = $"/{_containerName}/";
                if (!uri.AbsolutePath.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    return rawBlobUrl;
                }
                
                string blobName = uri.AbsolutePath.Substring(prefix.Length);
                blobName = Uri.UnescapeDataString(blobName);

                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(blobName);

                if (blobClient.CanGenerateSasUri)
                {
                    var sasBuilder = new Azure.Storage.Sas.BlobSasBuilder
                    {
                        BlobContainerName = blobClient.BlobContainerName,
                        BlobName = blobClient.Name,
                        Resource = "b",
                        StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
                        ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)
                    };
                    sasBuilder.SetPermissions(Azure.Storage.Sas.BlobSasPermissions.Read);
                    
                    if (isDownload)
                    {
                        sasBuilder.ContentDisposition = "attachment";
                    }
                    else
                    {
                        sasBuilder.ContentDisposition = "inline";
                    }
                    
                    string ext = System.IO.Path.GetExtension(blobName).ToLower();
                    sasBuilder.ContentType = ext switch
                    {
                        ".pdf" => "application/pdf",
                        ".png" => "image/png",
                        ".jpg" or ".jpeg" => "image/jpeg",
                        ".gif" => "image/gif",
                        _ => "application/octet-stream"
                    };

                    var sasUri = blobClient.GenerateSasUri(sasBuilder);
                    return sasUri.ToString();
                }
            }
            catch (Exception)
            {
                // Fallback to original URL
            }

            return rawBlobUrl;
        }
    }
}