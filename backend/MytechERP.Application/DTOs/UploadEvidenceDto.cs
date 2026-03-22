using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.DTOs
{
    public class UploadEvidenceDto
    {
        public IFormFile File { get; set; } 
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? TechnicianId { get; set; }
    }
}
