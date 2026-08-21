import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient as api } from "../../services/apiClient";
import { Save, Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { TermsAndConditionsSection } from "../../components/TermsAndConditionsSection";
import { PromptModal } from "../../components/common/PromptModal";
import { AutoResizeTextarea } from "../../components/common/AutoResizeTextarea";

export function SupplyQuotationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().substring(0, 10));
    const [quotationFor, setQuotationFor] = useState("");
    const [revisionNumber, setRevisionNumber] = useState("0");
    const [headerToName, setHeaderToName] = useState("");
    const [headerDesignation, setHeaderDesignation] = useState("");
    const [headerCompany, setHeaderCompany] = useState("");
    const [headerLocation, setHeaderLocation] = useState("");
    const [termsAndConditions, setTermsAndConditions] = useState("");
    
    const [supplyColumns, setSupplyColumns] = useState<string[]>(["Supply-1 Unit Rate"]);
    const [items, setItems] = useState<any[]>([{ sNo: 1, description: "", quantity: 1, unit: "", rates: { "Supply-1 Unit Rate": 0 }, totalAmount: 0 }]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/supplyquotation/${id}`);
            const q = res.data;
            setQuoteDate(new Date(q.quoteDate).toISOString().substring(0, 10));
            setQuotationFor(q.quotationFor || "");
            setRevisionNumber(q.revisionNumber || "0");
            setHeaderToName(q.headerToName || "");
            setHeaderDesignation(q.headerDesignation || "");
            setHeaderCompany(q.headerCompany || "");
            setHeaderLocation(q.headerLocation || "");
            setTermsAndConditions(q.termsAndConditionsJson || "");
            const cols = JSON.parse(q.supplyColumnsJson || '["Supply-1 Unit Rate"]');
            setSupplyColumns(cols);
            
            const fetchedItems = q.items.map((i: any) => ({
                sNo: i.sNo,
                description: i.description,
                quantity: i.quantity,
                unit: i.unit,
                rates: JSON.parse(i.ratesJson || '{}'),
                totalAmount: i.totalAmount
            }));
            setItems(fetchedItems);
            setTaxPercentage(q.taxPercentage || 0);
            setTaxAmount(q.taxAmount || 0);
            setNetTotal(q.netTotal || 0);
            setGrandTotal(q.grandTotal || 0);
            setApprovedBy(q.approvedBy || "");
            setIssuedBy(q.issuedBy || "");
        } catch (error) {
            console.error(error);
        }
    };

    const [isPromptOpen, setIsPromptOpen] = useState(false);

    const [taxPercentage, setTaxPercentage] = useState(0);
    const [taxAmount, setTaxAmount] = useState(0);
    const [netTotal, setNetTotal] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [approvedBy, setApprovedBy] = useState("");
    const [issuedBy, setIssuedBy] = useState("");

    const addColumn = () => {
        setIsPromptOpen(true);
    };

    const handlePromptConfirm = (name: string) => {
        setIsPromptOpen(false);
        if (name && !supplyColumns.includes(name)) {
            setSupplyColumns([...supplyColumns, name]);
            setItems(items.map(item => ({ ...item, rates: { ...item.rates, [name]: 0 } })));
        }
    };

    const addItem = () => {
        const newRates: any = {};
        supplyColumns.forEach(c => newRates[c] = 0);
        setItems([...items, { sNo: items.length + 1, description: "", quantity: 1, unit: "", rates: newRates, totalAmount: 0 }]);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx).map((item, i) => ({ ...item, sNo: i + 1 })));
    };

    const removeColumn = (col: string) => {
        setSupplyColumns(supplyColumns.filter(c => c !== col));
        setItems(items.map(item => {
            const newRates = { ...item.rates };
            delete newRates[col];
            return { ...item, rates: newRates };
        }));
    };

    const recalculateRowTotal = (item: any) => {
        const sumRates = Object.values(item.rates).reduce((a: any, b: any) => parseFloat(a || 0) + parseFloat(b || 0), 0) as number;
        return sumRates * (parseFloat(item.quantity || 0) as number);
    };

    useEffect(() => {
        // Auto calculate net total, tax, grand total whenever items or taxPercentage change
        const currentNetTotal = items.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
        const computedTaxAmount = currentNetTotal * (taxPercentage / 100);
        const computedGrandTotal = currentNetTotal + computedTaxAmount;
        
        setNetTotal(currentNetTotal);
        setTaxAmount(computedTaxAmount);
        setGrandTotal(computedGrandTotal);
    }, [items, taxPercentage]);

    const updateItem = (idx: number, field: string, val: any) => {
        const newItems = [...items];
        newItems[idx][field] = val;
        if (field === 'quantity') {
            newItems[idx].totalAmount = recalculateRowTotal(newItems[idx]);
        }
        setItems(newItems);
    };

    const updateItemRate = (idx: number, col: string, val: any) => {
        const newItems = [...items];
        newItems[idx].rates[col] = parseFloat(val) || 0;
        newItems[idx].totalAmount = recalculateRowTotal(newItems[idx]);
        setItems(newItems);
    };

    const [isSaving, setIsSaving] = useState(false);

    const save = async () => {
        setIsSaving(true);
        const payload = {
            quoteDate,
            quotationFor,
            revisionNumber,
            headerToName,
            headerDesignation,
            headerCompany,
            headerLocation,
            termsAndConditionsJson: termsAndConditions,
            supplyColumns,
            taxPercentage,
            taxAmount,
            netTotal,
            grandTotal,
            approvedBy,
            issuedBy,
            items
        };

        try {
            if (id) {
                await api.put(`/supplyquotation/${id}`, payload);
            } else {
                await api.post("/supplyquotation", payload);
            }
            navigate("/supply-quotations");
        } catch (error) {
            console.error(error);
            alert("Failed to save.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate("/supply-quotations")} className="text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold">{id ? "Edit" : "New"} Supply Quotation</h1>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 border-r pr-6">
                        <h3 className="font-bold text-gray-700">Client / Header Details</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">To (Name / Attention)</label>
                            <input type="text" placeholder="e.g. Mr. Muhammad Ismail Shah" value={headerToName} onChange={e => setHeaderToName(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Designation</label>
                            <input type="text" placeholder="e.g. Electrical Engineer" value={headerDesignation} onChange={e => setHeaderDesignation(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Company</label>
                            <input type="text" placeholder="e.g. EPCL" value={headerCompany} onChange={e => setHeaderCompany(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Location / Address</label>
                            <input type="text" placeholder="e.g. Karachi, Pakistan" value={headerLocation} onChange={e => setHeaderLocation(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700">Quotation Meta</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Revision Number</label>
                            <input type="text" value={revisionNumber} onChange={e => setRevisionNumber(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Quotation For</label>
                            <input type="text" placeholder="e.g. Electrical Items List Rev-02..." value={quotationFor} onChange={e => setQuotationFor(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Items</h3>
                        <button onClick={addColumn} className="bg-blue-50 text-blue-600 px-4 py-2 rounded border border-blue-200 flex items-center hover:bg-blue-100 transition">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Supply Column
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border text-sm">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="p-2 border-r text-center w-12">S.NO</th>
                                    <th className="p-2 border-r text-left w-64">DESCRIPTION</th>
                                    <th className="p-2 border-r text-center w-24">QTY</th>
                                    <th className="p-2 border-r text-center w-24">UNIT</th>
                                    {supplyColumns.map((col, idx) => (
                                        <th key={idx} className="p-2 border-r text-center w-32 relative group">
                                            {col}
                                            <button onClick={() => removeColumn(col)} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 bg-white rounded shadow p-1">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </th>
                                    ))}
                                    <th className="p-2 text-center w-32">TOTAL AMOUNT</th>
                                    <th className="p-2 w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="p-2 border-r text-center align-top">{item.sNo}</td>
                                        <td className="p-2 border-r align-top">
                                            <AutoResizeTextarea 
                                                rows={1}
                                                value={item.description} 
                                                onChange={e => updateItem(idx, 'description', e.target.value)} 
                                                className="w-full bg-transparent outline-none resize-y min-h-[38px] p-1 border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded" 
                                                placeholder="Description" 
                                            />
                                        </td>
                                        <td className="p-2 border-r align-top">
                                            <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent outline-none p-1" />
                                        </td>
                                        <td className="p-2 border-r align-top">
                                            <input type="text" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="w-full text-center bg-transparent outline-none p-1" placeholder="Nos" />
                                        </td>
                                        {supplyColumns.map((col, cIdx) => (
                                            <td key={cIdx} className="p-2 border-r align-top">
                                                <input type="number" value={item.rates[col] || 0} onChange={e => updateItemRate(idx, col, e.target.value)} className="w-full text-center bg-transparent outline-none p-1" />
                                            </td>
                                        ))}
                                        <td className="p-2 border-r align-top">
                                            <input type="number" value={item.totalAmount} onChange={e => updateItem(idx, 'totalAmount', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent outline-none font-bold text-primary p-1" />
                                        </td>
                                        <td className="p-2 text-center align-top">
                                            <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                                                <Trash2 className="w-4 h-4 mx-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={addItem} className="mt-4 text-primary font-medium flex items-center hover:underline">
                        <Plus className="w-4 h-4 mr-1" /> Add Row
                    </button>
                    
                    <div className="mt-6 border-t pt-4 max-w-sm ml-auto space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-600">Net Total</span>
                            <span className="font-bold">{netTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-600">Tax (%)</span>
                                <input type="number" value={taxPercentage} onChange={e => setTaxPercentage(parseFloat(e.target.value) || 0)} className="w-16 border rounded p-1 text-center" />
                            </div>
                            <span className="font-bold">{taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg border-t pt-2">
                            <span className="font-bold text-gray-800">Grand Total</span>
                            <span className="font-bold text-primary">{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Issued By (Name & Designation)</label>
                        <input type="text" placeholder="e.g. Ali Khan - Sales Manager" value={issuedBy} onChange={e => setIssuedBy(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Approved By (Name & Designation)</label>
                        <input type="text" placeholder="e.g. John Doe - Director" value={approvedBy} onChange={e => setApprovedBy(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-2">Terms & Conditions</h3>
                    <TermsAndConditionsSection 
                        valueJson={termsAndConditions} 
                        onChangeJson={setTermsAndConditions} 
                    />
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={save} 
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium flex items-center hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 space-x-2 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>{isSaving ? "Saving..." : "Save"}</span>
                    </button>
                </div>
            </div>

            <PromptModal
                isOpen={isPromptOpen}
                title="New Supply Column"
                message="Enter new supply column name:"
                placeholder={`Supply-${supplyColumns.length + 1} Unit Rate`}
                onConfirm={handlePromptConfirm}
                onCancel={() => setIsPromptOpen(false)}
            />
        </div>
    );
}
