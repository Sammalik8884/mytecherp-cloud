export interface VendorDto {
    id: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
}

export interface CreateVendorDto {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
}

export interface PurchaseOrderDto {
    id: number;
    poNumber: string;
    vendorId: number;
    vendorName?: string;
    targetWarehouseId: number;
    orderDate: string;
    expectedDeliveryDate: string;
    status: number; // 0=Draft, 1=Sent, 2=Received, 3=Cancelled
    totalAmount: number;
    items: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItemDto {
    id: number;
    purchaseOrderId: number;
    productId: number;
    productName?: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitCost: number;
}

export interface CreatePODto {
    vendorId: number;
    targetWarehouseId: number;
    expectedDeliveryDate: string;
    items: CreatePOItemDto[];
}

export interface CreatePOItemDto {
    productId: number;
    quantity: number;
    unitCost: number;
}
