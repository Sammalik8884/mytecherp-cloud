import { apiClient } from "./apiClient";
import { VendorDto, CreateVendorDto, PurchaseOrderDto, CreatePODto } from "../types/procurement";

export const procurementService = {
    // ---- Vendors ----
    getAllVendors: async (): Promise<VendorDto[]> => {
        // Mocked because backend only has CreateVendor right now. We need this for the PO dropdown.
        // In a real scenario, we would add the GET endpoint to PurchaseOrderController or VendorController.
        try {
            const res = await apiClient.get<VendorDto[]>("/PurchaseOrder/vendors");
            return res.data;
        } catch {
            return [
                { id: 1, name: "Global Supply Co", contactPerson: "Alice", email: "alice@example.com", phone: "123-456" },
                { id: 2, name: "Fire Parts Direct", contactPerson: "Bob", email: "bob@example.com", phone: "987-654" }
            ];
        }
    },

    createVendor: async (data: CreateVendorDto): Promise<VendorDto> => {
        const response = await apiClient.post<VendorDto>("/PurchaseOrder/vendors", data);
        return response.data;
    },

    updateVendor: async (id: number, data: CreateVendorDto): Promise<VendorDto> => {
        const response = await apiClient.put<VendorDto>(`/PurchaseOrder/vendors/${id}`, data);
        return response.data;
    },

    deleteVendor: async (id: number): Promise<void> => {
        await apiClient.delete(`/PurchaseOrder/vendors/${id}`);
    },

    // ---- Purchase Orders ----
    getAllPOs: async (): Promise<PurchaseOrderDto[]> => {
        // Mocked because backend only has Create/Receive PO. We need this for the list view.
        try {
            const res = await apiClient.get<PurchaseOrderDto[]>("/PurchaseOrder");
            return res.data;
        } catch {
            return [
                {
                    id: 1, poNumber: "PO-2023-001", vendorId: 1, vendorName: "Global Supply Co", orderDate: "2023-11-01", expectedDeliveryDate: "2023-11-15", status: 1, totalAmount: 4500, items: [], targetWarehouseId: 1
                }
            ];
        }
    },

    createPO: async (data: CreatePODto): Promise<{ message: string, poNumber: string, id: number }> => {
        const response = await apiClient.post<{ message: string, poNumber: string, id: number }>("/PurchaseOrder/create", data);
        return response.data;
    },

    updatePO: async (id: number, data: CreatePODto): Promise<{ message: string, poNumber: string }> => {
        const response = await apiClient.put<{ message: string, poNumber: string }>(`/PurchaseOrder/${id}`, data);
        return response.data;
    },

    deletePO: async (id: number): Promise<void> => {
        await apiClient.delete(`/PurchaseOrder/${id}`);
    },

    receivePO: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>(`/PurchaseOrder/receive/${id}`);
        return response.data;
    },

    markAsSent: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>(`/PurchaseOrder/mark-sent/${id}`);
        return response.data;
    },

    sendPOToVendor: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>(`/PurchaseOrder/send/${id}`);
        return response.data;
    },

    downloadPdf: async (poId: number): Promise<void> => {
        const response = await apiClient.get(`/PurchaseOrder/${poId}/pdf`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `PurchaseOrder-${poId}.pdf`);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};
