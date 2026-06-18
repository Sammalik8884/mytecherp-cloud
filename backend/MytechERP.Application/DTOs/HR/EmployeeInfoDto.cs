using System;

namespace MytechERP.Application.DTOs.HR
{
    public class EmployeeInfoDto
    {
        public int Id { get; set; }
        public string EmploymentType { get; set; } = string.Empty;
        public string CreatedByUserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public string? EmployeeNumber { get; set; }
        public string? EmployeeName { get; set; }
        public string? MailingAddress { get; set; }
        public string? MothersMaidenName { get; set; }
        public string? GrossSalary { get; set; }
        public string? Designation { get; set; }
        public string? AccountBranchCode { get; set; }
        public string? OfficePhoneNo { get; set; }
        public string? MobileNetwork { get; set; }
        public string? MobileNumber { get; set; }
        public string? PlaceOfBirth { get; set; }
        public string? EmailAddress { get; set; }

        public string? EmployeeCnicNumber { get; set; }
        public string? FatherHusbandName { get; set; }
        public string? Gender { get; set; }
        public string? DateOfBirth { get; set; }
        public string? DateOfIssue { get; set; }
        public string? ExpiryDate { get; set; }
        public string? PresentAddress { get; set; }
        public string? PaDistrictCity { get; set; }
        public string? PermanentAddress { get; set; }

        public string? KinFullName { get; set; }
        public string? KinCnicNumber { get; set; }
        public string? KinRelationship { get; set; }
        public string? KinMobileNumber { get; set; }
    }
}
