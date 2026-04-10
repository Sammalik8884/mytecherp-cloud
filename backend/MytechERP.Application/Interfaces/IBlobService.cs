using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IBlobService
    {
        Task<string> UploadAsync(IFormFile file, string fileName);
        Task<string> UploadStreamAsync(System.IO.Stream stream, string fileName, string contentType);
        string GenerateSasUrl(string rawBlobUrl, int expiryMinutes = 60);
    }
}
