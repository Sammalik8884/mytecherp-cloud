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
    }
}
