export interface CustomerDto {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
}

export interface CreateCustomerDto {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
}
