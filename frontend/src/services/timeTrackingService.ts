import { apiClient } from "./apiClient";
import { CheckInDto, CheckOutDto } from "../types/field";

export const timeTrackingService = {
    checkIn: async (data: CheckInDto): Promise<any> => {
        const response = await apiClient.post<any>("/TimeTracking/check-in", data);
        return response.data;
    },

    checkOut: async (data: CheckOutDto): Promise<any> => {
        const response = await apiClient.post<any>("/TimeTracking/check-out", data);
        return response.data;
    }
};
