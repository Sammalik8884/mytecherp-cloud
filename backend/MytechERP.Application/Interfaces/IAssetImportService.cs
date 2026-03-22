using System.IO;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.Asset;

namespace MytechERP.Application.Interfaces
{
    public interface IAssetImportService
    {
        Task<AssetImportResultDto> ImportFromExcelOrCsvAsync(Stream fileStream, string fileName, bool isDryRun);
    }
}
