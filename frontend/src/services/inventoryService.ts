import { apiClient } from "./apiClient";
import { StockLevelDto, CreateTransferDto, StockMovementDto, CreateAdjustmentDto } from "../types/inventory";

export const inventoryService = {
    getStockLevels: async (productId: number): Promise<StockLevelDto[]> => {
        const response = await apiClient.get<StockLevelDto[]>(`/Inventory/stock/${productId}`);
        return response.data;
    },

    addStock: async (movement: StockMovementDto): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>("/Inventory/stock/add", movement);
        return response.data;
    },

    transferStock: async (transfer: CreateTransferDto): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>("/Inventory/transfer", transfer);
        return response.data;
    },

    adjustStock: async (adjustment: CreateAdjustmentDto): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>("/Inventory/adjust", adjustment);
        return response.data;
    },

    updateStock: async (movement: StockMovementDto): Promise<{ message: string }> => {
        const response = await apiClient.put<{ message: string }>("/Inventory/stock/update", movement);
        return response.data;
    },

    deleteStock: async (productId: number, warehouseId: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/Inventory/stock/${productId}/${warehouseId}`);
        return response.data;
    }
};
