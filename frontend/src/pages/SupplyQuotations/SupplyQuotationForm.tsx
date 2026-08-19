import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient as api } from "../../services/apiClient";
import { Save, Plus, Trash2, ArrowLeft } from "lucide-react";
import { TermsAndConditionsSection } from "../../components/TermsAndConditionsSection";

export function SupplyQuotationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().substring(0, 10));
    const [quotationFor, setQuotationFor] = useState("");
    const [revisionNumber, setRevisionNumber] = useState("0");
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
            const res = await api.get(`/api/supplyquotation/${id}`);
            const q = res.data;
            setQuoteDate(new Date(q.quoteDate).toISOString().substring(0, 10));
            setQuotationFor(q.quotationFor || "");
            setRevisionNumber(q.revisionNumber || "0");
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
        } catch (error) {
            console.error(error);
        }
    };

    const addColumn = () => {
        const name = prompt("Enter new supply column name:", `Supply-${supplyColumns.length + 1} Unit Rate`);
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

    const updateItem = (idx: number, field: string, val: any) => {
        const newItems = [...items];
        newItems[idx][field] = val;
        setItems(newItems);
    };

    const updateItemRate = (idx: number, col: string, val: any) => {
        const newItems = [...items];
        newItems[idx].rates[col] = parseFloat(val) || 0;
        setItems(newItems);
    };

    const save = async () => {
        const payload = {
            quoteDate,
            quotationFor,
            revisionNumber,
            termsAndConditionsJson: termsAndConditions,
            supplyColumns,
            items
        };

        try {
            if (id) {
                await api.put(`/api/supplyquotation/${id}`, payload);
            } else {
                await api.post("/api/supplyquotation", payload);
            }
            navigate("/supply-quotations");
        } catch (error) {
            console.error(error);
            alert("Failed to save.");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/supply-quotations")} className="p-2 bg-gray-100 rounded hover:bg-gray-200">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold">{id ? "Edit" : "New"} Supply Quotation</h1>
                </div>
                <button onClick={save} className="bg-brand text-white px-6 py-2 rounded flex items-center hover:bg-brand/90 transition">
                    <Save className="w-5 h-5 mr-2" />
                    Save
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <input type="text" value={quotationFor} onChange={e => setQuotationFor(e.target.value)} className="w-full border rounded p-2" placeholder="e.g. Electrical Items List Rev-02..." />
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
                                        <td className="p-2 border-r text-center">{item.sNo}</td>
                                        <td className="p-2 border-r">
                                            <input type="text" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="w-full bg-transparent outline-none" placeholder="Description" />
                                        </td>
                                        <td className="p-2 border-r">
                                            <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent outline-none" />
                                        </td>
                                        <td className="p-2 border-r">
                                            <input type="text" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="w-full text-center bg-transparent outline-none" placeholder="Nos" />
                                        </td>
                                        {supplyColumns.map((col, cIdx) => (
                                            <td key={cIdx} className="p-2 border-r">
                                                <input type="number" value={item.rates[col] || 0} onChange={e => updateItemRate(idx, col, e.target.value)} className="w-full text-center bg-transparent outline-none" />
                                            </td>
                                        ))}
                                        <td className="p-2 border-r">
                                            <input type="number" value={item.totalAmount} onChange={e => updateItem(idx, 'totalAmount', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent outline-none font-bold text-brand" />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4 mx-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={addItem} className="mt-4 text-brand font-medium flex items-center hover:underline">
                        <Plus className="w-4 h-4 mr-1" /> Add Row
                    </button>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-2">Terms & Conditions</h3>
                    <TermsAndConditionsSection 
                        valueJson={termsAndConditions} 
                        onChangeJson={setTermsAndConditions} 
                    />
                </div>
            </div>
        </div>
    );
}
