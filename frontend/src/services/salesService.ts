import { apiClient } from "./apiClient";
import { 
    SalesLeadDto, CreateSalesLeadDto, UpdateSalesLeadDto, 
    SiteVisitDto, StartSiteVisitDto, EndSiteVisitDto,
    CreateInitialClientVisitDto, LeadQuoteDto
} from "../types/sales";

export const salesService = {
    // --- LEADS ---
    getLeads: async (): Promise<SalesLeadDto[]> => {
        const response = await apiClient.get<SalesLeadDto[]>("/Sales/leads");
        return response.data;
    },

    getLead: async (id: number): Promise<SalesLeadDto> => {
        const response = await apiClient.get<SalesLeadDto>(`/Sales/leads/${id}`);
        return response.data;
    },

    createLead: async (data: CreateSalesLeadDto): Promise<{ message: string; id: number }> => {
        const response = await apiClient.post<{ message: string; id: number }>("/Sales/leads", data);
        return response.data;
    },

    updateLead: async (id: number, data: UpdateSalesLeadDto): Promise<{ message: string }> => {
        const response = await apiClient.put<{ message: string }>(`/Sales/leads/${id}`, data);
        return response.data;
    },

    deleteLead: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/Sales/leads/${id}`);
        return response.data;
    },

    closeLead: async (id: number, boqFile?: File, drawingsFile?: File, notes?: string): Promise<{ message: string }> => {
        const formData = new FormData();
        if (boqFile) formData.append("BOQFile", boqFile);
        if (drawingsFile) formData.append("DrawingsFile", drawingsFile);
        if (notes) formData.append("Notes", notes);

        const response = await apiClient.post<{ message: string }>(`/Sales/leads/${id}/close`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    },

    convertToQuotation: async (id: number): Promise<{ message: string, quotationId: number }> => {
        const response = await apiClient.post<{ message: string, quotationId: number }>(`/Sales/leads/${id}/convert`);
        return response.data;
    },

    reopenLead: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>(`/Sales/leads/${id}/reopen`);
        return response.data;
    },

    createInitialClientVisit: async (data: CreateInitialClientVisitDto): Promise<{ message: string; leadId: number }> => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'photo' || key === 'visitingCardPhoto') {
                    formData.append(key, value as File);
                } else {
                    formData.append(key, value.toString());
                }
            }
        });

        const response = await apiClient.post<{ message: string; leadId: number }>("/Sales/initial-client-visit", formData, {
            headers: { 'Content-Type': undefined }
        });
        return response.data;
    },

    getInitialClientData: async (leadId: number): Promise<CreateInitialClientVisitDto> => {
        const response = await apiClient.get<CreateInitialClientVisitDto>(`/Sales/leads/${leadId}/initial-data`);
        return response.data;
    },

    updateInitialClientData: async (leadId: number, data: CreateInitialClientVisitDto): Promise<{ message: string }> => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'photo' || key === 'visitingCardPhoto') {
                    formData.append(key, value as File);
                } else {
                    formData.append(key, value.toString());
                }
            }
        });

        const response = await apiClient.put<{ message: string }>(`/Sales/leads/${leadId}/initial-data`, formData, {
            headers: { 'Content-Type': undefined }
        });
        return response.data;
    },

    reviseBoq: async (id: number, boqFile?: File, drawingsFile?: File, notes?: string): Promise<{ message: string }> => {
        const formData = new FormData();
        if (boqFile) formData.append("BOQFile", boqFile);
        if (drawingsFile) formData.append("DrawingsFile", drawingsFile);
        if (notes) formData.append("Notes", notes);

        const response = await apiClient.put<{ message: string }>(`/Sales/leads/${id}/revise-boq`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    getLeadQuotes: async (leadId: number): Promise<LeadQuoteDto[]> => {
        const response = await apiClient.get<LeadQuoteDto[]>(`/Sales/leads/${leadId}/quotes`);
        return response.data;
    },

    // --- VISITS ---
    getVisits: async (leadId: number): Promise<SiteVisitDto[]> => {
        const response = await apiClient.get<SiteVisitDto[]>(`/Sales/leads/${leadId}/visits`);
        return response.data;
    },

    startVisit: async (leadId: number, data: StartSiteVisitDto): Promise<{ message: string, visitId: number }> => {
        const response = await apiClient.post<{ message: string, visitId: number }>(`/Sales/leads/${leadId}/visits/start`, data);
        return response.data;
    },

    endVisit: async (visitId: number, data: EndSiteVisitDto): Promise<{ message: string }> => {
        const response = await apiClient.put<{ message: string }>(`/Sales/visits/${visitId}/end`, data);
        return response.data;
    },

    uploadVisitPhoto: async (visitId: number, file: File, caption?: string): Promise<{ message: string, photoUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        if (caption) formData.append("caption", caption);

        const response = await apiClient.post<{ message: string, photoUrl: string }>(`/Sales/visits/${visitId}/photos`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    }
};
