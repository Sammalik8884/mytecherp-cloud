import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient as api } from "../../services/apiClient";
import { Save, Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { AutoResizeTextarea } from "../../components/common/AutoResizeTextarea";

function numberToWords(num: number): string {
    if (num === 0) return "Zero";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    function convert(n: number): string {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
        if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
        return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
    }
    
    return convert(Math.floor(num)) + " Only";
}

export function SalesInvoiceForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [invoiceNumber, setInvoiceNumber] = useState("MTG-");
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().substring(0, 10));
    const [customerName, setCustomerName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [siteName, setSiteName] = useState("");
    const [siteNtn, setSiteNtn] = useState("");
    const [projectName, setProjectName] = useState("");
    const [scopeOfWork, setScopeOfWork] = useState("");
    const [poRef, setPoRef] = useState("");
    const [sesRef, setSesRef] = useState("");
    const [myTechNtnRef, setMyTechNtnRef] = useState("7600035-3");
    
    const [items, setItems] = useState<any[]>([{ sNo: 1, description: "", quantity: 1, unit: "", rate: 0, amount: 0 }]);

    const [subTotal, setSubTotal] = useState(0);
    const [gstPercentage, setGstPercentage] = useState(0);
    const [gstAmount, setGstAmount] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [amountInWords, setAmountInWords] = useState("");

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/salesinvoice/${id}`);
            const d = res.data;
            setInvoiceNumber(d.invoiceNumber || "MTG-");
            setInvoiceDate(d.invoiceDate ? new Date(d.invoiceDate).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
            setCustomerName(d.customerName || "");
            setContactPerson(d.contactPerson || "");
            setSiteName(d.siteName || "");
            setSiteNtn(d.siteNtn || "");
            setProjectName(d.projectName || "");
            setScopeOfWork(d.scopeOfWork || "");
            setPoRef(d.poRef || "");
            setSesRef(d.sesRef || "");
            setMyTechNtnRef(d.myTechNtnRef || "7600035-3");
            
            if (d.items && d.items.length > 0) {
                setItems(d.items);
            }
            setGstPercentage(d.gstPercentage || 0);
            
            // Allow recalculation via effect
        } catch (error) {
            console.error("Failed to fetch invoice", error);
        }
    };

    useEffect(() => {
        // Auto calculate totals
        const currentSubTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const computedGstAmount = currentSubTotal * (gstPercentage / 100);
        const computedGrandTotal = currentSubTotal + computedGstAmount;
        
        setSubTotal(currentSubTotal);
        setGstAmount(computedGstAmount);
        setGrandTotal(computedGrandTotal);
        
        setAmountInWords(numberToWords(computedGrandTotal));
    }, [items, gstPercentage]);

    const addItem = () => {
        setItems([...items, { sNo: items.length + 1, description: "", quantity: 1, unit: "", rate: 0, amount: 0 }]);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx).map((item, i) => ({ ...item, sNo: i + 1 })));
    };

    const updateItem = (idx: number, field: string, val: any) => {
        const newItems = [...items];
        newItems[idx][field] = val;
        
        if (field === 'quantity' || field === 'rate') {
            const q = parseFloat(newItems[idx].quantity) || 0;
            const r = parseFloat(newItems[idx].rate) || 0;
            newItems[idx].amount = q * r;
        }
        
        setItems(newItems);
    };

    const save = async () => {
        setIsSaving(true);
        const payload = {
            invoiceNumber,
            invoiceDate,
            customerName,
            contactPerson,
            siteName,
            siteNtn,
            projectName,
            scopeOfWork,
            poRef,
            sesRef,
            myTechNtnRef,
            subTotal,
            gstPercentage,
            gstAmount,
            grandTotal,
            amountInWords,
            items
        };

        try {
            if (id) {
                await api.put(`/salesinvoice/${id}`, payload);
            } else {
                await api.post("/salesinvoice", payload);
            }
            navigate("/sales-invoices");
        } catch (error) {
            console.error(error);
            alert("Failed to save invoice.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate("/sales-invoices")} className="text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold">{id ? "Edit" : "New"} Sales Invoice</h1>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 border-r pr-6">
                        <h3 className="font-bold text-gray-700">Client Details</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Customer Name</label>
                            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Contact Person</label>
                            <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Site Name</label>
                            <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Site NTN</label>
                            <input type="text" value={siteNtn} onChange={e => setSiteNtn(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700">Invoice Meta</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Invoice Number</label>
                            <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Invoice Date</label>
                            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Project Name</label>
                            <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Scope of Work</label>
                            <input type="text" value={scopeOfWork} onChange={e => setScopeOfWork(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                    <div>
                        <label className="block text-sm font-medium mb-1">PO Ref.</label>
                        <input type="text" value={poRef} onChange={e => setPoRef(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">SES Ref.</label>
                        <input type="text" value={sesRef} onChange={e => setSesRef(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">My Tech NTN Ref.</label>
                        <input type="text" value={myTechNtnRef} onChange={e => setMyTechNtnRef(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4">Items</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border text-sm">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="p-2 border-r text-center w-12">S.NO</th>
                                    <th className="p-2 border-r text-left">DESCRIPTION</th>
                                    <th className="p-2 border-r text-center w-24">QTY</th>
                                    <th className="p-2 border-r text-center w-24">UNIT</th>
                                    <th className="p-2 border-r text-center w-32">RATE</th>
                                    <th className="p-2 border-r text-center w-32">AMOUNT</th>
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
                                        <td className="p-2 border-r align-top">
                                            <input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} className="w-full text-center bg-transparent outline-none p-1" />
                                        </td>
                                        <td className="p-2 border-r align-top">
                                            <input type="number" value={item.amount} readOnly className="w-full text-center bg-transparent outline-none font-bold text-primary p-1" />
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
                            <span className="font-medium text-gray-600">Sub Total</span>
                            <span className="font-bold">{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-600">GST (%)</span>
                                <input type="number" value={gstPercentage} onChange={e => setGstPercentage(parseFloat(e.target.value) || 0)} className="w-16 border rounded p-1 text-center" />
                            </div>
                            <span className="font-bold">{gstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg border-t pt-2">
                            <span className="font-bold text-gray-800">Grand Total</span>
                            <span className="font-bold text-primary">{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                        <label className="block text-sm font-medium mb-1">Amount In Words</label>
                        <input type="text" value={amountInWords} onChange={e => setAmountInWords(e.target.value)} className="w-full border rounded p-2 font-medium" />
                    </div>
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
        </div>
    );
}
