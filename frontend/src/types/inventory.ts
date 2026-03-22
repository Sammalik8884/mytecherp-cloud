export interface StockLevelDto {
    warehouseId: number;
    warehouseName: string;
    quantity: number;
    binLocation: string;
}

export interface StockTransferItemDto {
    productId: number;
    quantity: number;
}

export interface CreateTransferDto {
    fromWarehouseId: number;
    toWarehouseId: number;
    notes: string;
    items: StockTransferItemDto[];
}

export interface StockMovementDto {
    productId: number;
    warehouseId: number;
    quantity: number;
}

export interface CreateAdjustmentDto {
    productId: number;
    warehouseId: number;
    quantity: number;
    reason: string;
}

export interface WarehouseDto {
    id: number;
    name: string;
    location: string;
    isMobile: boolean;
}
