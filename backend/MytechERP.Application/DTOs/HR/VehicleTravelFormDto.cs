using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.HR
{
    public class VehicleTravelFormDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public string EmployeeName { get; set; }
        public string EmployeeId { get; set; }
        public string Contact { get; set; }
        public string VehicleName { get; set; }
        public string RegistrationNumber { get; set; }
        public double StartReading { get; set; }
        public double EndReading { get; set; }
        public DateTime CurrentDate { get; set; }
        public string CreatedByUserId { get; set; }
        public string CreatedByUserName { get; set; }
        public string Status { get; set; }
        public DateTime? ApprovedByShahbazAt { get; set; }
        public DateTime? ApprovedByMunawarAt { get; set; }
        public List<VehicleTravelFormAttachmentDto> Attachments { get; set; } = new List<VehicleTravelFormAttachmentDto>();
    }

    public class VehicleTravelFormAttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
    }
}
