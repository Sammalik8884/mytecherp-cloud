import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, Loader2, Info } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { quotationService, CreateQuotationDto, CreateQuotationItemDto } from "../services/quotationService";
import { customerService } from "../services/customerService";
import { siteService } from "../services/siteService";
import { productService } from "../services/productService";
import { salesService } from "../services/salesService";

import { CustomerDto } from "../types/customer";
import { SiteDto } from "../types/site";
import { ProductDto } from "../types/product";


type UiItem = CreateQuotationItemDto & { 
    id: string; // unique ID for React list key
    product?: ProductDto; 
    unitPrice: number; 
    lineTotal: number; 
    calcBreakdown?: any; 
    originalPrice?: number;
};

export const QuotationFormPage = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const leadIdParam = searchParams.get("leadId");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [customers, setCustomers] = useState<CustomerDto[]>([]);
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [products, setProducts] = useState<ProductDto[]>([]);

    const [formData, setFormData] = useState<Omit<CreateQuotationDto, 'items'>>({
        customerId: 0,
        siteId: undefined,
        assetId: undefined,
        currency: "PKR",
        exchangeRate: 300, 
        globalCommissionPct: 0,
        gstPercentage: 18, // Default
        incomeTaxPercentage: 0,
        adjustment: 0,
        quoteMode: "Local",
        supplyColumnMode: "Both",
        costFactorPct: 60,
        importationPct: 13.75,
        transportationPct: 2,
        profitPct: 15
    });

    // Selections for Quote Sections
    const [showImported, setShowImported] = useState(false);
    const [showLocal, setShowLocal] = useState(false);
    const [showServices, setShowServices] = useState(false);
    
    // Lists holding our UI items
    const [importedItems, setImportedItems] = useState<UiItem[]>([]);
    const [localItems, setLocalItems] = useState<UiItem[]>([]);
    const [serviceItems, setServiceItems] = useState<UiItem[]>([]);

    // Breakdown Modal state
    const [modalBreakdown, setModalBreakdown] = useState<any>(null);

    // Initial Fetch
    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoading(true);
                const [custData, siteData, prodData] = await Promise.all([
                    customerService.getAll().catch(() => []),
                    siteService.getAll().catch(() => []),
                    productService.getAll(1, 1000).catch(() => [])
                ]);
                setCustomers(custData);
                setSites(siteData);
                const rawProds = prodData as any;
                const prodArray: ProductDto[] = Array.isArray(rawProds) ? rawProds : Array.isArray(rawProds?.data) ? rawProds.data : [];
                setProducts(prodArray);

                if (isEditMode) {
                    const quote = await quotationService.getQuotationById(Number(id));
                    setFormData(prev => ({
                        ...prev,
                        customerId: quote.customerId,
                        siteId: quote.siteName ? siteData.find(s => s.name === quote.siteName)?.id : undefined,
                        currency: quote.currency,
                        gstPercentage: quote.gstPercentage,
                        incomeTaxPercentage: quote.incomeTaxPercentage,
                        adjustment: quote.adjustment,
                        quoteMode: quote.quoteMode || "Local",
                        supplyColumnMode: quote.supplyColumnMode || "Both",
                    }));

                    setShowImported(quote.items.some(i => i.itemType === "Imported"));
                    setShowLocal(quote.items.some(i => i.itemType === "Local"));
                    setShowServices(quote.items.some(i => i.itemType === "Service"));

                    const imp: UiItem[] = [];
                    const loc: UiItem[] = [];
                    const srv: UiItem[] = [];

                    quote.items.forEach(i => {
                        const p = prodArray.find((prod: any) => prod.id === i.productId);
                        const uiItem: UiItem = {
                            id: Math.random().toString(36).substr(2, 9),
                            productId: i.productId,
                            quantity: i.quantity,
                            itemType: i.itemType,
                            product: p,
                            unitPrice: i.unitPrice,
                            lineTotal: i.lineTotal,
                            serviceName: i.serviceName,
                            servicePrice: i.originalPrice,
                            originalPrice: i.originalPrice,
                            calcBreakdown: i.calculationBreakdown ? JSON.parse(i.calculationBreakdown) : null
                        };
                        
                        if (i.itemType === "Imported") imp.push(uiItem);
                        else if (i.itemType === "Local") loc.push(uiItem);
                        else srv.push(uiItem);
                    });

                    setImportedItems(imp);
                    setLocalItems(loc);
                    setServiceItems(srv);

                } else if (leadIdParam) {
                    const leadData = await salesService.getLead(Number(leadIdParam)).catch(() => null);
                    if (leadData) {
                        setFormData(prev => ({
                            ...prev,
                            customerId: leadData.customerId,
                            siteId: leadData.siteName ? siteData.find(s => s.name === leadData.siteName)?.id : undefined,
                            opportunityId: leadData.id
                        }));
                    }
                }
            } catch (error) {
                toast.error("Failed to load form dependencies.");
            } finally {
                setLoading(false);
            }
        };

        fetchDependencies();
    }, [id, isEditMode, leadIdParam]);

    // Recalculate imported items when config changes
    useEffect(() => {
        if (!isEditMode && importedItems.length > 0) {
            setImportedItems(prev => prev.map(item => calculateImportedItem(item, formData)));
        }
    }, [formData.costFactorPct, formData.importationPct, formData.transportationPct, formData.profitPct, formData.exchangeRate]);

    const calculateImportedItem = (item: UiItem, config: Omit<CreateQuotationDto, 'items'>): UiItem => {
         if (!item.product) return item;
         const basePrice = item.product.priceAED || item.product.price; // USD logic
         const costPricePKR = basePrice * config.exchangeRate;
         const negotiatedCost = costPricePKR * (config.costFactorPct! / 100);
         const impCharge = negotiatedCost * (config.importationPct! / 100);
         const transCharge = negotiatedCost * (config.transportationPct! / 100);
         const profCharge = negotiatedCost * (config.profitPct! / 100);
         const finalPrice = negotiatedCost + impCharge + transCharge + profCharge;
         
         return {
             ...item,
             unitPrice: finalPrice,
             lineTotal: finalPrice * item.quantity,
             originalPrice: basePrice,
             calcBreakdown: {
                 originalPrice: basePrice,
                 exchangeRate: config.exchangeRate,
                 costPricePKR,
                 negotiatedCost,
                 importationCharge: impCharge,
                 transportationCharge: transCharge,
                 profitCharge: profCharge,
                 finalPrice
             }
         };
    };

    const handleAddImported = () => {
        setImportedItems([...importedItems, { id: Math.random().toString(), productId: 0, quantity: 1, itemType: "Imported", unitPrice: 0, lineTotal: 0 }]);
    };
    
    const handleAddLocal = () => {
        setLocalItems([...localItems, { id: Math.random().toString(), productId: 0, quantity: 1, itemType: "Local", unitPrice: 0, lineTotal: 0 }]);
    };

    const handleAddService = () => {
        setServiceItems([...serviceItems, { id: Math.random().toString(), quantity: 1, itemType: "Service", unitPrice: 0, lineTotal: 0, serviceName: "", servicePrice: 0 }]);
    };

    const renderTotals = () => {
        let subTotal = 0;
        if (showImported) subTotal += importedItems.reduce((acc, i) => acc + i.lineTotal, 0);
        if (showLocal) subTotal += localItems.reduce((acc, i) => acc + i.lineTotal, 0);
        if (showServices) subTotal += serviceItems.reduce((acc, i) => acc + i.lineTotal, 0);

        const gst = subTotal * (formData.gstPercentage / 100);
        const income = subTotal * (formData.incomeTaxPercentage / 100);
        const grand = subTotal + gst + income - formData.adjustment;

        return { subTotal, gst, income, grand };
    };

    const totals = renderTotals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.customerId === 0) {
            toast.error("Please select a customer."); return;
        }

        const payloadItems: CreateQuotationItemDto[] = [];
        
        if (showImported) {
             const valid = importedItems.filter(i => i.productId && i.productId > 0);
             payloadItems.push(...valid.map(i => ({ productId: i.productId, quantity: i.quantity, itemType: "Imported" })));
        }
        if (showLocal) {
             const valid = localItems.filter(i => i.productId && i.productId > 0);
             payloadItems.push(...valid.map(i => ({ productId: i.productId, quantity: i.quantity, itemType: "Local", manualCommissionPct: i.manualCommissionPct })));
        }
        if (showServices) {
             const valid = serviceItems.filter(i => i.serviceName && i.serviceName.trim() !== "");
             payloadItems.push(...valid.map(i => ({ quantity: i.quantity, itemType: "Service", serviceName: i.serviceName, servicePrice: i.servicePrice })));
        }

        if (payloadItems.length === 0) {
            toast.error("Please add at least one valid product or service line item."); return;
        }

        const modes = [];
        if (showImported) modes.push("Imported");
        if (showLocal) modes.push("Local");
        if (showServices) modes.push("Services");
        
        const finalQuoteMode = modes.length > 0 ? modes.join(",") : "Local";

        setSaving(true);
        try {
            const payload: CreateQuotationDto = {
                ...formData,
                quoteMode: finalQuoteMode,
                items: payloadItems
            };

            if (isEditMode) {
                await quotationService.updateQuotation(Number(id), payload);
                toast.success("Quotation updated successfully");
            } else {
                await quotationService.createQuotation(payload);
                toast.success("Quotation created successfully");
            }
            navigate('/quotations');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Error saving quotation");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-24"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

    const availableSites = sites.filter(s => s.customerId === formData.customerId);

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-32">
            <div className="flex items-center space-x-4 mb-8">
                <button onClick={() => navigate('/quotations')} className="p-2 hover:bg-secondary/50 rounded-lg text-muted-foreground"><ArrowLeft className="h-5 w-5"/></button>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        {isEditMode ? "Edit Quotation" : "Create Quotation"}
                    </h1>
                    <p className="text-muted-foreground">Select sections and build your quote</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. SECTIONS TOGGLE */}
                <div className="bg-secondary/20 border border-border/50 rounded-2xl p-6 shadow-md flex justify-center gap-6 flex-wrap">
                     <label className="flex items-center gap-2 cursor-pointer p-4 rounded-xl border-2 hover:border-primary transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                         <input type="checkbox" className="hidden" checked={showImported} onChange={e => setShowImported(e.target.checked)}/>
                         <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${showImported ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
                             {showImported && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                         </div>
                         <span className="font-semibold text-foreground">Imported Items</span>
                     </label>

                     <label className="flex items-center gap-2 cursor-pointer p-4 rounded-xl border-2 hover:border-primary transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                         <input type="checkbox" className="hidden" checked={showLocal} onChange={e => setShowLocal(e.target.checked)}/>
                         <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${showLocal ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
                             {showLocal && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                         </div>
                         <span className="font-semibold text-foreground">Local Items</span>
                     </label>

                     <label className="flex items-center gap-2 cursor-pointer p-4 rounded-xl border-2 hover:border-primary transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                         <input type="checkbox" className="hidden" checked={showServices} onChange={e => setShowServices(e.target.checked)}/>
                         <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${showServices ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
                             {showServices && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                         </div>
                         <span className="font-semibold text-foreground">Services</span>
                     </label>
                </div>

                {/* HEADER INFO */}
                <div className="bg-secondary/30 rounded-2xl p-6 shadow-md grid grid-cols-1 md:grid-cols-4 gap-6">
                     <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Customer *</label>
                        <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: Number(e.target.value), siteId: 0})} className="w-full bg-background border px-3 py-2 rounded-lg">
                            <option value={0} disabled>Select...</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Site</label>
                        <select value={formData.siteId || 0} onChange={e => setFormData({...formData, siteId: Number(e.target.value)||undefined})} className="w-full bg-background border px-3 py-2 rounded-lg">
                             <option value={0}>No Site</option>
                             {availableSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                     <div>
                         <label className="text-xs font-semibold text-muted-foreground block mb-1">PDF Mode</label>
                         <select value={formData.supplyColumnMode} onChange={e => setFormData({...formData, supplyColumnMode: e.target.value})} className="w-full bg-background border px-3 py-2 rounded-lg">
                            <option value="Both">Show Both Tables</option>
                            <option value="ImportedOnly">Only Imported+Services</option>
                            <option value="LocalOnly">Only Local+Services</option>
                         </select>
                     </div>
                     <div>
                         <label className="text-xs font-semibold tracking-wide text-primary block mb-1">Exchange Rate (USD to PKR)</label>
                         <input type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})} className="w-full bg-background border border-primary/40 px-3 py-2 rounded-lg focus:ring focus:ring-primary/20" />
                     </div>
                </div>

                {/* IMPORTED SECTION */}
                {showImported && (
                     <div className="bg-white dark:bg-zinc-900 border-l-4 border-l-blue-500 rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-4">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold text-blue-500">Imported Items</h3>
                             <button type="button" onClick={handleAddImported} className="text-sm bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-lg flex items-center"><Plus className="w-4 h-4 mr-1"/> Add Row</button>
                         </div>

                         {/* Config line */}
                         <div className="flex gap-4 mb-4 text-xs bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                             <div>Cost Factor %: <input type="number" className="w-16 bg-white dark:bg-black rounded border px-1" value={formData.costFactorPct} onChange={e=>setFormData({...formData, costFactorPct: Number(e.target.value)})} /></div>
                             <div>Import %: <input type="number" step="0.01" className="w-16 bg-white dark:bg-black rounded border px-1" value={formData.importationPct} onChange={e=>setFormData({...formData, importationPct: Number(e.target.value)})} /></div>
                             <div>Trans %: <input type="number" className="w-16 bg-white dark:bg-black rounded border px-1" value={formData.transportationPct} onChange={e=>setFormData({...formData, transportationPct: Number(e.target.value)})} /></div>
                             <div>Profit %: <input type="number" className="w-16 bg-white dark:bg-black rounded border px-1" value={formData.profitPct} onChange={e=>setFormData({...formData, profitPct: Number(e.target.value)})} /></div>
                         </div>

                         <table className="w-full text-sm">
                             <thead className="text-xs text-muted-foreground"><tr><th className="text-left py-2">Product</th><th className="w-24">Qty</th><th className="w-32 text-right">Base(USD)</th><th className="w-32 text-right">Final(PKR)</th><th className="w-32 text-right">Total</th><th></th></tr></thead>
                             <tbody>
                                 {importedItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/40">
                                         <td className="py-2">
                                              <select value={item.productId || 0} onChange={e => {
                                                  const p = products.find(x => x.id === Number(e.target.value));
                                                  const newArr = [...importedItems];
                                                  newArr[idx] = calculateImportedItem({ ...newArr[idx], productId: p!.id, product: p }, formData);
                                                  setImportedItems(newArr);
                                              }} className="w-full border rounded p-1.5">
                                                  <option value={0}>Select Product...</option>
                                                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                              </select>
                                         </td>
                                         <td className="px-2">
                                              <input type="number" className="w-full border rounded p-1.5" min="1" value={item.quantity} onChange={e => {
                                                  const newArr = [...importedItems];
                                                  newArr[idx].quantity = Number(e.target.value);
                                                  newArr[idx].lineTotal = newArr[idx].quantity * newArr[idx].unitPrice;
                                                  setImportedItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="text-right text-muted-foreground">{item.originalPrice?.toLocaleString() || '0.00'}</td>
                                         <td className="text-right font-medium flex items-center justify-end gap-2">
                                             {item.calcBreakdown && <Info className="h-4 w-4 text-blue-400 cursor-pointer hover:text-blue-600" onClick={() => setModalBreakdown(item.calcBreakdown)}/>}
                                             {item.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                         </td>
                                         <td className="text-right font-bold">{item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                         <td className="text-center"><button type="button" onClick={() => setImportedItems(importedItems.filter(x=>x.id !== item.id))}><Trash2 className="w-4 h-4 text-red-500"/></button></td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                )}

                {/* LOCAL SECTION */}
                {showLocal && (
                     <div className="bg-white dark:bg-zinc-900 border-l-4 border-l-emerald-500 rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-4">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold text-emerald-500">Local Items</h3>
                             <button type="button" onClick={handleAddLocal} className="text-sm bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-lg flex items-center"><Plus className="w-4 h-4 mr-1"/> Add Row</button>
                         </div>
                         <table className="w-full text-sm">
                             <thead className="text-xs text-muted-foreground"><tr><th className="text-left py-2">Product</th><th className="w-24">Qty</th><th className="w-32 text-right">Price(PKR)</th><th className="w-24 px-2">Discount%</th><th className="w-32 text-right">Total</th><th></th></tr></thead>
                             <tbody>
                                 {localItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/40">
                                         <td className="py-2">
                                              <select value={item.productId || 0} onChange={e => {
                                                  const p = products.find(x => x.id === Number(e.target.value));
                                                  const newArr = [...localItems];
                                                  newArr[idx].productId = p!.id;
                                                  newArr[idx].product = p;
                                                  newArr[idx].unitPrice = p!.price;
                                                  newArr[idx].lineTotal = newArr[idx].quantity * p!.price * (1 - (newArr[idx].manualCommissionPct||0)/100);
                                                  setLocalItems(newArr);
                                              }} className="w-full border rounded p-1.5">
                                                  <option value={0}>Select Product...</option>
                                                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                              </select>
                                         </td>
                                         <td className="px-2">
                                              <input type="number" className="w-full border rounded p-1.5" min="1" value={item.quantity} onChange={e => {
                                                  const newArr = [...localItems];
                                                  newArr[idx].quantity = Number(e.target.value);
                                                  newArr[idx].lineTotal = newArr[idx].quantity * newArr[idx].unitPrice * (1 - (newArr[idx].manualCommissionPct||0)/100);
                                                  setLocalItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="text-right text-muted-foreground">{item.unitPrice.toLocaleString()}</td>
                                         <td className="px-2">
                                              <input type="number" className="w-full border rounded p-1.5" min="0" max="100" value={item.manualCommissionPct||""} onChange={e => {
                                                  const newArr = [...localItems];
                                                  newArr[idx].manualCommissionPct = Number(e.target.value);
                                                  newArr[idx].lineTotal = newArr[idx].quantity * newArr[idx].unitPrice * (1 - (newArr[idx].manualCommissionPct||0)/100);
                                                  setLocalItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="text-right font-bold">{item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                         <td className="text-center"><button type="button" onClick={() => setLocalItems(localItems.filter(x=>x.id !== item.id))}><Trash2 className="w-4 h-4 text-red-500"/></button></td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                )}

                {/* SERVICES SECTION */}
                {showServices && (
                     <div className="bg-white dark:bg-zinc-900 border-l-4 border-l-purple-500 rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-4">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold text-purple-500">Services</h3>
                             <button type="button" onClick={handleAddService} className="text-sm bg-purple-500/10 text-purple-600 px-3 py-1.5 rounded-lg flex items-center"><Plus className="w-4 h-4 mr-1"/> Add Row</button>
                         </div>
                         <table className="w-full text-sm">
                             <thead className="text-xs text-muted-foreground"><tr><th className="text-left py-2">Service Name</th><th className="w-24">Qty</th><th className="w-32 text-right">Price(PKR)</th><th className="w-32 text-right">Total</th><th></th></tr></thead>
                             <tbody>
                                 {serviceItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/40">
                                         <td className="py-2">
                                              <input type="text" placeholder="Installation, Commissioning, etc." className="w-full border rounded p-1.5" value={item.serviceName||""} onChange={e => {
                                                  const newArr = [...serviceItems];
                                                  newArr[idx].serviceName = e.target.value;
                                                  setServiceItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="px-2">
                                              <input type="number" className="w-full border rounded p-1.5" min="1" value={item.quantity} onChange={e => {
                                                  const newArr = [...serviceItems];
                                                  newArr[idx].quantity = Number(e.target.value);
                                                  newArr[idx].lineTotal = newArr[idx].quantity * (newArr[idx].servicePrice||0);
                                                  setServiceItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="pl-2">
                                              <input type="number" className="w-full border rounded p-1.5 text-right" min="0" value={item.servicePrice||0} onChange={e => {
                                                  const newArr = [...serviceItems];
                                                  newArr[idx].servicePrice = Number(e.target.value);
                                                  newArr[idx].unitPrice = Number(e.target.value);
                                                  newArr[idx].lineTotal = newArr[idx].quantity * newArr[idx].unitPrice;
                                                  setServiceItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="text-right font-bold">{item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                         <td className="text-center"><button type="button" onClick={() => setServiceItems(serviceItems.filter(x=>x.id !== item.id))}><Trash2 className="w-4 h-4 text-red-500"/></button></td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                )}

                {/* TAXES AND TOTALS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-secondary/30 rounded-2xl p-6 shadow-md">
                         <h3 className="text-lg font-semibold mb-4">Taxes & Adjustments</h3>
                         <div className="grid grid-cols-2 gap-4">
                             <div>GST (%) <input type="number" className="w-full border rounded p-2 mt-1" value={formData.gstPercentage} onChange={e => setFormData({...formData, gstPercentage: Number(e.target.value)})}/></div>
                             <div>Income Tax (%) <input type="number" className="w-full border rounded p-2 mt-1" value={formData.incomeTaxPercentage} onChange={e => setFormData({...formData, incomeTaxPercentage: Number(e.target.value)})}/></div>
                             <div>Global Adj (-) <input type="number" className="w-full border rounded p-2 mt-1 text-red-500" value={formData.adjustment} onChange={e => setFormData({...formData, adjustment: Number(e.target.value)})}/></div>
                         </div>
                     </div>
                     <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
                         <div className="space-y-3">
                             <div className="flex justify-between text-muted-foreground"><span>Sub Total</span><span>{totals.subTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                             {formData.gstPercentage > 0 && <div className="flex justify-between text-muted-foreground"><span>GST</span><span>+ {totals.gst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             {formData.incomeTaxPercentage > 0 && <div className="flex justify-between text-muted-foreground"><span>Income Tax</span><span>+ {totals.income.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             {formData.adjustment > 0 && <div className="flex justify-between text-red-400"><span>Adjustment</span><span>- {formData.adjustment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             
                             <div className="border-t pt-3 flex justify-between items-end">
                                 <span className="text-lg font-bold">Grand Total</span>
                                 <span className="text-2xl font-black text-primary">{totals.grand.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm">PKR</span></span>
                             </div>
                         </div>

                         <div className="mt-8 flex justify-end gap-4">
                             <button type="button" onClick={() => navigate('/quotations')} className="px-6 py-2.5 rounded-xl hover:bg-secondary/50">Cancel</button>
                             <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform font-bold flex items-center gap-2">
                                 {saving && <Loader2 className="w-4 h-4 animate-spin"/>} {isEditMode ? "Update" : "Save Quotation"}
                             </button>
                         </div>
                     </div>
                </div>
            </form>

            {/* BREAKDOWN MODAL */}
            {modalBreakdown && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-background rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">Price Calculation Pipeline</h2>
                        </div>
                        <div className="space-y-4 text-sm font-medium">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">List Price (USD / AED)</span>
                                <span>{modalBreakdown.originalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center bg-secondary/20 p-2 rounded-lg">
                                <span className="text-muted-foreground">Exchange Rate</span>
                                <span className="text-primary font-bold">× {modalBreakdown.exchangeRate}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-muted-foreground">Cost Price (PKR)</span>
                                <span>{modalBreakdown.costPricePKR.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>

                            <div className="h-px bg-border my-2"></div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Negotiated Cost ({modalBreakdown.costFactorPct}%)</span>
                                <span>{modalBreakdown.negotiatedCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-blue-500/80">
                                <span>+ Importation ({modalBreakdown.importationPct}%)</span>
                                <span>{modalBreakdown.importationCharge.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-amber-500/80">
                                <span>+ Transportation ({modalBreakdown.transportationPct}%)</span>
                                <span>{modalBreakdown.transportationCharge.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-emerald-500/80">
                                <span>+ Profit ({modalBreakdown.profitPct}%)</span>
                                <span>{modalBreakdown.profitCharge.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            
                            <div className="mt-4 bg-primary/10 p-4 rounded-xl flex justify-between items-center border border-primary/20">
                                <span className="font-bold text-foreground">Final Unit Price</span>
                                <span className="text-xl font-black text-primary">{modalBreakdown.finalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <button onClick={() => setModalBreakdown(null)} className="w-full mt-6 bg-secondary hover:bg-secondary/80 text-foreground py-3 rounded-xl font-semibold transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
