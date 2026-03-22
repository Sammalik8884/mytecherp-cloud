using System.Collections.Generic;

namespace MytechERP.Application.DTOs.Asset
{
    public class AssetImportResultDto
    {
        public bool IsSuccess { get; set; }
        public bool WasDryRun { get; set; }
        public int TotalRowsProcessed { get; set; }
        public int SuccessfullyParsedCount { get; set; }
        public Dictionary<int, string> Errors { get; set; } = new Dictionary<int, string>();
    }
}
