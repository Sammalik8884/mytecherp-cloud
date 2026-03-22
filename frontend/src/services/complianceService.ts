import { apiClient } from "./apiClient";

export const complianceService = {
    downloadCertificate: async (quoteId: number): Promise<void> => {
        const response = await apiClient.get(`/Compliance/certificate/${quoteId}`, {
            responseType: 'blob'
        });

        // Create a blob from the response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Create a temporary link element to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Certificate-${quoteId}.pdf`); // We don't have quote number, just ID for now
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};
