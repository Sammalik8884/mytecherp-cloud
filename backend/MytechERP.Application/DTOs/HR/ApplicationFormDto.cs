using System;
using System.Collections.Generic;

namespace MytechERP.Application.DTOs.HR
{
    public class ApplicationFormDto
    {
        public int Id { get; set; }
        public string ApplicantName { get; set; }
        public string Designation { get; set; }
        public DateTime ApplicationDate { get; set; }
        public string EmployeeCode { get; set; }
        public string PhoneNumber { get; set; }
        public string EmployeeType { get; set; }
        public string Subject { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string DirectorRemarks { get; set; }
        public string CeoRemarks { get; set; }
        public string RejectionRemarks { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<ApplicationFormAttachmentDto> Attachments { get; set; } = new List<ApplicationFormAttachmentDto>();
    }

    public class ApplicationFormAttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
    }
}
