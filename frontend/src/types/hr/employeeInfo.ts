export interface EmployeeInfo {
    id: number;
    employmentType: string;
    
    // Employee Details
    employeeNumber?: string;
    employeeName?: string;
    mailingAddress?: string;
    mothersMaidenName?: string;
    grossSalary?: string;
    designation?: string;
    accountBranchCode?: string;
    officePhoneNo?: string;
    mobileNetwork?: string;
    mobileNumber?: string;
    placeOfBirth?: string;
    emailAddress?: string;

    // CNIC Details
    employeeCnicNumber?: string;
    fatherHusbandName?: string;
    gender?: string;
    dateOfBirth?: string;
    dateOfIssue?: string;
    expiryDate?: string;
    presentAddress?: string;
    paDistrictCity?: string;
    permanentAddress?: string;

    // Next of KIN
    kinFullName?: string;
    kinCnicNumber?: string;
    kinRelationship?: string;
    kinMobileNumber?: string;
}

export interface CreateEmployeeInfo {
    employmentType: string;
    
    employeeNumber?: string;
    employeeName?: string;
    mailingAddress?: string;
    mothersMaidenName?: string;
    grossSalary?: string;
    designation?: string;
    accountBranchCode?: string;
    officePhoneNo?: string;
    mobileNetwork?: string;
    mobileNumber?: string;
    placeOfBirth?: string;
    emailAddress?: string;

    employeeCnicNumber?: string;
    fatherHusbandName?: string;
    gender?: string;
    dateOfBirth?: string;
    dateOfIssue?: string;
    expiryDate?: string;
    presentAddress?: string;
    paDistrictCity?: string;
    permanentAddress?: string;

    kinFullName?: string;
    kinCnicNumber?: string;
    kinRelationship?: string;
    kinMobileNumber?: string;
}
