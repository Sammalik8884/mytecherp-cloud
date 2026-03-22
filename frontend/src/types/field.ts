export interface AssetDto {
    id: number;
    name: string;
    serialNumber: string;
    assetType: string;
    assetTypeId: number;
    status: string;
    location: string;
    floor: string;
    room: string;
    siteName: string;
    brand: string;
    expiryDate: string;
}

export interface CreateAssetDto {
    name: string;
    serialNumber: string;
    assetTypeId: number;
    status: string;
    location: string;
    floor: string;
    room: string;
    brand: string;
    expiryDate: string;
    siteId: number;
    categoryId: number;
}

export interface UpdateAssetDto extends CreateAssetDto {
    id: number;
}

export interface WorkOrderDto {
    id: number;
    description: string;
    status: string;
    scheduledDate: string;
    completedDate?: string | null;
    contractId: number;
    customerName: string;
    siteName: string;
    technicianId?: string | null;
    technicianName?: string;
    technicianNotes?: string;
    result: string;
    checkInTime?: string;
    checkOutTime?: string;
}

export interface CreateWorkOrderDto {
    description: string;
    scheduledDate: string;
    contractId: number;
    technicianId?: string | null;
    assetId?: number;
}

export interface UpdateWorkOrderDto {
    id: number;
    description: string;
    status: string;
    scheduledDate: string;
    technicianId?: string | null;
    assetId?: number | null;
}

export interface CheckInDto {
    workOrderId: number;
    latitude?: number | null;
    longitude?: number | null;
}

export interface CheckOutDto {
    workOrderId: number;
    latitude?: number | null;
    longitude?: number | null;
}

export interface CompleteJobRequest {
    notes: string;
    result: number;
}

export interface ChecklistResultDto {
    id: number;
    questionText: string;
    inputType: string;
    options: string[];
    selectedValue?: string | null;
    isPass: boolean;
}

export interface UpdateChecklistDto {
    resultId: number;
    selectedValue: string;
    comments?: string | null;
}
