import { apiClient } from "./apiClient";
import { PaymentRequestDto, PaymentResponseDto } from "../types/finance";

export const paymentService = {
    initiateStripeCheckout: async (request: PaymentRequestDto): Promise<PaymentResponseDto> => {
        const response = await apiClient.post<PaymentResponseDto>("/Payment/initiate", request);
        return response.data;
    }
};
