// frontend/src/types/contract.ts

export interface ContractDto {
    id: number;
    customerId: number;
    customerName?: string;
    description: string;
    startDate: string;
    endDate: string;
    value: number;
    status: number; // 0=Draft, 1=Active, 2=Expired, 3=Cancelled
    referenceQuotationId?: number;
    items: ContractItemDto[];
}

export interface ContractItemDto {
    id: number;
    contractId: number;
    assetId: number;
    assetName?: string;
    notes: string;
}

export interface CreateContractDto {
    customerId: number;
    description: string;
    startDate: string;
    endDate: string;
    value: number;
}

export interface UpdateContractDto {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    visitFrequencyMonths: number;
    contractValue: number;
    isActive: boolean;
}

export interface CreateContractItemDto {
    contractId: number;
    assetId: number;
    notes: string;
}
