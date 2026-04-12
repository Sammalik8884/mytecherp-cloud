using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IFikeProductImportService
    {
        Task<string> ImportExcelAsync(IFormFile file, string brandName, int tenantId);

        /// <summary>
        /// Import from a byte array (used by background jobs since IFormFile is not serializable).
        /// </summary>
        Task<string> ImportExcelFromBytesAsync(byte[] fileBytes, string brandName, int tenantId);
    }
}
