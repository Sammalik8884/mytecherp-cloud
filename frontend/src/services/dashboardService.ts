import { apiClient } from "./apiClient";

export interface ChartDataPoint {
    name: string;
    value: number;
}

export interface SalesmanActivityRecord {
    salesmanUserId: string;
    salesmanName: string;
    date: string;
    totalVisits: number;
    activityPercentage: number;
}

export interface SalesmanActivitySummary {
    salesmanUserId: string;
    salesmanName: string;
    totalVisitsInPeriod: number;
    averageVisitsPerDay: number;
    averageActivityPercentage: number;
    dailyRecords: SalesmanActivityRecord[];
}

export interface SalesmanActivityResponse {
    startDate: string;
    endDate: string;
    benchmarkVisitsPerDay: number;
    overallActivityTrend: ChartDataPoint[];
    salesmenSummary: SalesmanActivitySummary[];
}

export const getSalesmanActivityMetrics = async (startDate?: Date, endDate?: Date, region?: string, salesmanId?: string): Promise<SalesmanActivityResponse> => {
    let url = "/dashboard/sales-activity?";
    if (startDate) url += `startDate=${startDate.toISOString()}&`;
    if (endDate) url += `endDate=${endDate.toISOString()}&`;
    if (region) url += `region=${encodeURIComponent(region)}&`;
    if (salesmanId) url += `salesmanId=${encodeURIComponent(salesmanId)}&`;
    
    const res = await apiClient.get<SalesmanActivityResponse>(url);
    return res.data;
};

export const downloadSalesActivityPdf = (startDate?: Date, endDate?: Date, region?: string, salesmanId?: string) => {
    let url = "/dashboard/sales-activity/export/pdf?";
    if (startDate) url += `startDate=${startDate.toISOString()}&`;
    if (endDate) url += `endDate=${endDate.toISOString()}&`;
    if (region) url += `region=${encodeURIComponent(region)}&`;
    if (salesmanId) url += `salesmanId=${encodeURIComponent(salesmanId)}&`;
    
    // using token based fetch since apiClient uses interceptor, but file download is easily done via window.open if cookies/auth pass in URL, or by fetching blob
    return apiClient.get(url, { responseType: 'blob' })
        .then(response => {
            const tempUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = tempUrl;
            link.setAttribute('download', `Salesman_Activity_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        });
};

export interface QuoteActivityDetail {
    quoteId: number;
    quoteNumber: string;
    createdAt: string;
    status: string;
    totalLineItems: number;
    localSupplyLines: number;
    importedSupplyLines: number;
    localInstallLines: number;
    importedInstallLines: number;
}

export interface EstimatorActivitySummary {
    estimatorId: string;
    estimatorName: string;
    assignedQuotesCount: number;
    madeQuotesCount: number;
    pendingQuotesCount: number;
    approvedQuotesCount: number;
    totalLineItems: number;
    localSupplyLines: number;
    importedSupplyLines: number;
    localInstallLines: number;
    importedInstallLines: number;
    quoteActivityDetails: QuoteActivityDetail[];
}

export interface EstimatorActivityResponse {
    startDate: string;
    endDate: string;
    estimatorsSummary: EstimatorActivitySummary[];
}

export const getEstimatorsActivity = async (startDate?: Date, endDate?: Date, estimatorId?: string): Promise<EstimatorActivityResponse> => {
    let url = "/dashboard/estimator-activity?";
    if (startDate) url += `startDate=${startDate.toISOString()}&`;
    if (endDate) url += `endDate=${endDate.toISOString()}&`;
    if (estimatorId) url += `estimatorId=${encodeURIComponent(estimatorId)}&`;
    
    const res = await apiClient.get<EstimatorActivityResponse>(url);
    return res.data;
};

export const downloadSalesActivityCsv = (startDate?: Date, endDate?: Date, region?: string, salesmanId?: string) => {
    let url = "/dashboard/sales-activity/export/csv?";
    if (startDate) url += `startDate=${startDate.toISOString()}&`;
    if (endDate) url += `endDate=${endDate.toISOString()}&`;
    if (region) url += `region=${encodeURIComponent(region)}&`;
    if (salesmanId) url += `salesmanId=${encodeURIComponent(salesmanId)}&`;
    
    return apiClient.get(url, { responseType: 'blob' })
        .then(response => {
            const tempUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = tempUrl;
            link.setAttribute('download', `Salesman_Activity_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        });
};
