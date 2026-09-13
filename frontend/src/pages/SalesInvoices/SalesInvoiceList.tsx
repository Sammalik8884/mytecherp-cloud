import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient as api } from "../../services/apiClient";
import { Plus, Edit, Download, Trash2 } from "lucide-react";

export function SalesInvoiceList() {
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get("/salesinvoice");
            setInvoices(res.data);
        } catch (error) {
            console.error("Failed to fetch sales invoices", error);
        }
    };

    const downloadPdf = async (id: number) => {
        try {
            const response = await api.get(`/salesinvoice/${id}/pdf`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `SalesInvoice_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download PDF", error);
        }
    };

    const deleteInvoice = async (id: number) => {
        if (confirm("Are you sure you want to delete this invoice?")) {
            try {
                await api.delete(`/salesinvoice/${id}`);
                fetchInvoices();
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
                <Link to="/sales-invoices/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Create Invoice</span>
                </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Invoice Number</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Grand Total</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{inv.invoiceNumber}</td>
                                <td className="px-6 py-4">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{inv.customerName}</td>
                                <td className="px-6 py-4">{inv.projectName}</td>
                                <td className="px-6 py-4">{inv.grandTotal?.toFixed(2)}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <Link to={`/sales-invoices/edit/${inv.id}`} className="text-primary hover:text-primary/80" title="Edit">
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                    <button onClick={() => downloadPdf(inv.id)} className="text-red-500 hover:text-red-700" title="PDF">
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => deleteInvoice(inv.id)} className="text-gray-500 hover:text-gray-700" title="Delete">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No sales invoices found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
