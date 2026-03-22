export interface SiteDto {
    id: number;
    name: string;
    address: string;
    city: string;
    customerId: number;
    customerName: string;
}

export interface CreateSiteDto {
    name: string;
    address: string;
    city: string;
    customerId: number;
}
