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
            catch (Azure.RequestFailedException ex) when (ex.Status == 409 || ex.ErrorCode == "ContainerAlreadyExists" || ex.Message.Contains("already exists"))
            {
                // Container already exists, ignore
            }

            var blobClient = containerClient.GetBlobClient(fileName);


            using (var stream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, true);
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
            catch (Azure.RequestFailedException ex) when (ex.Status == 409 || ex.ErrorCode == "ContainerAlreadyExists" || ex.Message.Contains("already exists"))
            {
                // Container already exists, ignore
            }
            var blobClient = containerClient.GetBlobClient(fileName);

            var blobHttpHeaders = new BlobHttpHeaders { ContentType = contentType };
            await blobClient.UploadAsync(stream, new BlobUploadOptions { HttpHeaders = blobHttpHeaders });

            return blobClient.Uri.ToString();
        }
    }
}