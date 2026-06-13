using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.HR
{
    public class CreateApplicationFormDto
    {
        public string ApplicantName { get; set; }
        public string Designation { get; set; }
        public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
        public string EmployeeCode { get; set; }
        public string PhoneNumber { get; set; }
        public string EmployeeType { get; set; }
        public string Subject { get; set; }
        public string Description { get; set; }
        
        public List<IFormFile> Attachments { get; set; } = new List<IFormFile>();
    }
}
