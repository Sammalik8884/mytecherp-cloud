using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IProductImportService
    {
        Task<string> ImportExcelAsync(IFormFile file, string brandName, int tenantId);

        /// <summary>
        /// Import from a byte array (used by background jobs since IFormFile is not serializable).
        /// </summary>
        Task<string> ImportExcelFromBytesAsync(byte[] fileBytes, string brandName, int tenantId);
    }
}
