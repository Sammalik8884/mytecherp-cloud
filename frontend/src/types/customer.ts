export interface CustomerDto {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    isProspect: boolean;
}

export interface CreateCustomerDto {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    isProspect?: boolean;
}
