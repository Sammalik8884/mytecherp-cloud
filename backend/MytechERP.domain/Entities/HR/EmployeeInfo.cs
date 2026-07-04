using MytechERP.domain.Common;
using System;

namespace MytechERP.domain.Entities.HR
{
    public class EmployeeInfo : BaseEntity
    {
        // Metadata
        public string EmploymentType { get; set; } = string.Empty; // Temporary Employee or Permanent Employee
        public string CreatedByUserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        // Employee Details
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

        // CNIC Details
        public string? EmployeeCnicNumber { get; set; }
        public string? FatherHusbandName { get; set; }
        public string? Gender { get; set; }
        public string? DateOfBirth { get; set; }
        public string? DateOfIssue { get; set; }
        public string? ExpiryDate { get; set; }
        public string? PresentAddress { get; set; }
        public string? PaDistrictCity { get; set; }
        public string? PermanentAddress { get; set; }

        // Next of KIN
        public string? KinFullName { get; set; }
        public string? KinCnicNumber { get; set; }
        public string? KinRelationship { get; set; }
        public string? KinMobileNumber { get; set; }

        public string AttachmentsJson { get; set; } = "[]";

        [global::System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public global::System.Collections.Generic.List<string> Attachments
        {
            get => string.IsNullOrEmpty(AttachmentsJson) ? new global::System.Collections.Generic.List<string>() : global::System.Text.Json.JsonSerializer.Deserialize<global::System.Collections.Generic.List<string>>(AttachmentsJson) ?? new global::System.Collections.Generic.List<string>();
            set => AttachmentsJson = global::System.Text.Json.JsonSerializer.Serialize(value);
        }
    }
}
