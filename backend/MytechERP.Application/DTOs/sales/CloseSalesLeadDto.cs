using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace MytechERP.Application.DTOs.Sales
{
    public class CloseSalesLeadDto
    {
        public IFormFile? BOQFile { get; set; }
        public IFormFile? DrawingsFile { get; set; }

        public string? Notes { get; set; }
    }
}
