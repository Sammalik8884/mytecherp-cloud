import { apiClient } from "./apiClient";
import { ProductDto, CreateProductDto } from "../types/product";

export const productService = {
    getAll: async (pageNumber = 1, pageSize = 50, searchText = ""): Promise<ProductDto[]> => {
        let url = `/Product?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        if (searchText) {
            url += `&searchText=${encodeURIComponent(searchText)}`;
        }
        const response = await apiClient.get<ProductDto[]>(url);
        return response.data;
    },

    getById: async (id: number): Promise<ProductDto> => {
        const response = await apiClient.get<ProductDto>(`/Product/${id}`);
        return response.data;
    },

    create: async (data: CreateProductDto): Promise<{ message: string; id: number }> => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("categoryId", data.categoryId.toString());
        formData.append("price", data.price.toString());

        if (data.priceAED) formData.append("priceAED", data.priceAED.toString());
        if (data.costPrice) formData.append("costPrice", data.costPrice.toString());
        if (data.reorderLevel) formData.append("reorderLevel", data.reorderLevel.toString());
        if (data.description) formData.append("description", data.description);
        if (data.brand) formData.append("brand", data.brand);
        if (data.itemCode) formData.append("itemCode", data.itemCode);
        if (data.image) formData.append("image", data.image);

        const response = await apiClient.post<{ message: string; id: number }>("/Product/create-manual", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    },

    update: async (id: number, data: CreateProductDto): Promise<{ message: string }> => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("categoryId", data.categoryId.toString());
        formData.append("price", data.price.toString());

        if (data.priceAED) formData.append("priceAED", data.priceAED.toString());
        if (data.description) formData.append("description", data.description);
        if (data.brand) formData.append("brand", data.brand);
        if (data.itemCode) formData.append("itemCode", data.itemCode);
        if (data.image) formData.append("image", data.image);

        // API Update expecting matching FromForm fields
        const response = await apiClient.put<{ message: string }>(`/Product/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    },

    importExcel: async (file: File, brand: string = "LIFECO"): Promise<{ message: string }> => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post<{ message: string }>(`/Product/import-excel?brand=${encodeURIComponent(brand)}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    },

    delete: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/Product/${id}`);
        return response.data;
    }
};
