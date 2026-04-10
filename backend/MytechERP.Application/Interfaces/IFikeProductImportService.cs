using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IFikeProductImportService
    {
        Task<string> ImportExcelAsync(IFormFile file, string brandName, int tenantId);
    }
}
