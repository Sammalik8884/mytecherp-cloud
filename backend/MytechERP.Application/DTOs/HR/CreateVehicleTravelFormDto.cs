using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.HR
{
    public class CreateVehicleTravelFormDto
    {
        public string EmployeeName { get; set; }
        public string EmployeeId { get; set; }
        public string Contact { get; set; }
        public string VehicleName { get; set; }
        public string RegistrationNumber { get; set; }
        public double StartReading { get; set; }
        public double EndReading { get; set; }
        public DateTime CurrentDate { get; set; }

        public List<IFormFile> Attachments { get; set; } = new List<IFormFile>();
    }
}
