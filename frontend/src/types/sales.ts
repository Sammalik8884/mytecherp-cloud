export interface SalesLeadDto {
    id: number;
    leadNumber: string;
    siteId: number;
    siteName: string;
    customerId: number;
    customerName: string;
    salesmanUserId: string;
    salesmanName: string;
    status: string;
    notes: string;
    boqFileUrl?: string;
    drawingsFileUrl?: string;
    quotationId?: number;
    createdAt: string;
    visitCount: number;
}

export interface CreateSalesLeadDto {
    siteId: number;
    customerId: number;
    salesmanUserId: string;
    notes?: string;
}

export interface UpdateSalesLeadDto {
    notes?: string;
    status: string;
}

export interface CloseSalesLeadDto {
    boqFile?: File;
    drawingsFile?: File;
    notes?: string;
}

export interface VisitPhotoDto {
    id: number;
    photoUrl: string;
    caption?: string;
    uploadedAt: string;
}

export interface SiteVisitDto {
    id: number;
    salesLeadId: number;
    visitNumber: number;
    startTime?: string;
    endTime?: string;
    startLatitude?: number;
    startLongitude?: number;
    endLatitude?: number;
    endLongitude?: number;
    meetingNotes: string;
    createdAt: string;
    photos: VisitPhotoDto[];
}

export interface StartSiteVisitDto {
    startLatitude: number;
    startLongitude: number;
}

export interface EndSiteVisitDto {
    endLatitude: number;
    endLongitude: number;
    meetingNotes: string;
}

export interface CreateInitialClientVisitDto {
    name: string;
    email?: string;
    phone?: string;
    taxNumber?: string;
    address?: string;
    contactPersonName?: string;
    hasVisitingCard: boolean;
    contractorCompanyName?: string;
    furtherDetails?: string;
    siteName: string;
    siteCity: string;
    siteAddress: string;
    latitude?: number;
    longitude?: number;
    projectStatus?: string;
    remarks?: string;
    salespersonSignatureName?: string;
    photo?: File;
    visitingCardPhoto?: File;
}

export interface LeadQuoteDto {
    id: number;
    quoteNumber: string;
    status: string;
    issueDate: string;
    validUntil: string;
    grandTotal: number;
    notes: string;
}
