import { CategoryDto } from "./category";

export interface ProductDto {
    id: number;
    name: string;
    description: string;
    price: number;
    priceAED?: number;
    costPrice?: number;
    reorderLevel?: number;
    categoryId: number;
    category?: CategoryDto;
    imageUrl?: string;
    brand?: string;
    itemCode?: string;
}

export interface CreateProductDto {
    name: string;
    description?: string;
    price: number;
    priceAED?: number;
    costPrice?: number;
    reorderLevel?: number;
    categoryId: number;
    brand?: string;
    itemCode?: string;
    image?: File;
}

export interface PagedResponse<T> {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    data: T[];
}
