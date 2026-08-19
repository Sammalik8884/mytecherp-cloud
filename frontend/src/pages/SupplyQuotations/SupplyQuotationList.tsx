import { useState, useEffect } from "react";
import { Plus, Download, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient as api } from "../../services/apiClient";

export function SupplyQuotationList() {
    const [quotations, setQuotations] = useState<any[]>([]);

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        try {
            const res = await api.get("/api/supplyquotation");
            setQuotations(res.data);
        } catch (error) {
            console.error("Failed to fetch supply quotations", error);
        }
    };

    const downloadPdf = async (id: number) => {
        const response = await api.get(`/api/supplyquotation/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `SupplyQuotation_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const downloadExcel = async (id: number) => {
        const response = await api.get(`/api/supplyquotation/${id}/excel`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `SupplyQuotation_${id}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Supply Quotations</h1>
                <Link to="/supply-quotations/new" className="bg-brand text-white px-4 py-2 rounded flex items-center hover:bg-brand/90 transition">
                    <Plus className="w-5 h-5 mr-2" />
                    New Quotation
                </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-gray-700">Quote #</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Date</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Quotation For</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {quotations.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{q.quoteNumber}</td>
                                <td className="px-6 py-4">{new Date(q.quoteDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{q.quotationFor}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <Link to={`/supply-quotations/edit/${q.id}`} className="text-brand hover:text-brand-dark" title="Edit">
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                    <button onClick={() => downloadPdf(q.id)} className="text-red-500 hover:text-red-700" title="PDF">
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => downloadExcel(q.id)} className="text-green-500 hover:text-green-700" title="Excel">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {quotations.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No supply quotations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
