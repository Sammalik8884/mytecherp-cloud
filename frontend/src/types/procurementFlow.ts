export interface ProcurementRequestDto {
    id: number;
    procurementNumber: string;
    createdAt: string;
    updatedAt: string;
    supervisorName: string;
    supervisorEmail: string;
    siteId?: number;
    status: string;
    pdEmail?: string;
    pdRemarks?: string;
    pdApprovalDate?: string;
    procurementHeadEmail?: string;
    amountRequestFormId?: number;
    assignedExecutiveEmail?: string;
    assignedDate?: string;
    completedDate?: string;
    deliveryNoteText?: string;
    deliveryNoteDocuments: string[];
    items: ProcurementRequestItemDto[];
}

export interface ProcurementRequestItemDto {
    id: number;
    procurementRequestId: number;
    itemName: string;
    quantity: number;
    reason?: string;
}

export interface CreateProcurementRequestDto {
    siteId?: number;
    items: CreateProcurementItemDto[];
}

export interface CreateProcurementItemDto {
    itemName: string;
    quantity: number;
    reason?: string;
}

export interface PdReviewProcurementDto {
    isApproved: boolean;
    remarks?: string;
}

export interface AssignProcurementExecutiveDto {
    executiveEmail: string;
}

export interface CompleteProcurementDto {
    deliveryNoteText?: string;
    deliveryNoteDocuments: string[];
}
