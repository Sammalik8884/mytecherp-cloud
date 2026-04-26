import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, Loader2, Search, Calculator, Pencil } from "lucide-react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

import { quotationService, CreateQuotationDto, CreateQuotationItemDto } from "../services/quotationService";
import { customerService } from "../services/customerService";
import { siteService } from "../services/siteService";
import { productService } from "../services/productService";
import { salesService } from "../services/salesService";

import { CustomerDto } from "../types/customer";
import { SiteDto } from "../types/site";
import { ProductDto } from "../types/product";
import { ProductSelectionModal } from "../components/common/ProductSelectionModal";

/* ─── Unit options ─── */
const UNIT_OPTIONS = [
    "Nos",
    "Feet",
    "Meters",
    "Centimeters",
    "Inches",
    "Millimeters",
    "Sq. Feet",
    "Sq. Meters",
    "Cu. Feet",
    "Cu. Meters",
    "Kg",
    "Liters",
    "Rolls",
    "Sets",
    "Pairs",
    "Boxes",
    "Custom"
];

type UiItem = CreateQuotationItemDto & { 
    id: string;
    product?: ProductDto; 
    unitPrice: number; 
    lineTotal: number; 
    calcBreakdown?: any; 
    originalPrice?: number;
    unit?: string;
    unitQty?: number;
    customUnit?: string;
    isManualFinalPrice?: boolean;
};

/* ─── Main Page Component ─────────────────────────────────────── */
export const QuotationFormPage = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isReviseMode = location.pathname.includes('/revise');
    const hasId = Boolean(id);
    const isEditMode = hasId && !isReviseMode;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const leadIdParam = searchParams.get("leadId");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [customers, setCustomers] = useState<CustomerDto[]>([]);
    const [sites, setSites] = useState<SiteDto[]>([]);

    const [formData, setFormData] = useState<Omit<CreateQuotationDto, 'items'>>({
        customerId: 0,
        siteId: undefined,
        assetId: undefined,
        currency: "PKR",
        exchangeRate: 300, 
        globalCommissionPct: 0,
        gstPercentage: 18,
        incomeTaxPercentage: 0,
        adjustment: 0,
        quoteMode: "Local",
        supplyColumnMode: "Both",
        costFactorPct: 60,
        importationPct: 13.75,
        transportationPct: 2,
        profitPct: 15,
        projectCode: "FPS",
        quoteHeadline: ""
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

    // Product Selection Modal Target
    const [productModalTarget, setProductModalTarget] = useState<{ list: "imported" | "local", index: number } | null>(null);

    // Service name edit state
    const [editingServiceName, setEditingServiceName] = useState<{ list: "imported" | "local" | "service", index: number } | null>(null);

    // Helper: make empty row
    const makeEmptyRow = (itemType: string): UiItem => ({
        id: Math.random().toString(36).substr(2, 9),
        productId: 0,
        quantity: 1,
        itemType,
        unitPrice: 0,
        lineTotal: 0,
        serviceName: itemType === "Service" ? "" : undefined,
        servicePrice: itemType === "Service" ? 0 : undefined,
        unit: "",
        unitQty: 0,
        customUnit: "",
    });

    const handleCustomProductNameBlur = (name: string | undefined, quantity: number) => {
        if (!name || name.trim() === "") return;
        
        setShowServices(true);
        setServiceItems(prev => {
            if (prev.some(s => s.serviceName === name)) return prev;
            const blankIdx = prev.findIndex(s => !s.serviceName || s.serviceName.trim() === "");
            if (blankIdx !== -1) {
                const updated = [...prev];
                updated[blankIdx] = { ...updated[blankIdx], serviceName: name, quantity: quantity };
                return updated;
            }
            return [...prev, { ...makeEmptyRow("Service"), serviceName: name, quantity: quantity }];
        });
    };

    // Auto-add first row when section is toggled on
    useEffect(() => {
        if (showImported && importedItems.length === 0) {
            setImportedItems([makeEmptyRow("Imported")]);
        }
    }, [showImported]);

    useEffect(() => {
        if (showLocal && localItems.length === 0) {
            setLocalItems([makeEmptyRow("Local")]);
        }
    }, [showLocal]);

    // Note: Services section does NOT auto-create empty rows.
    // Service rows are auto-populated from product selections or added manually via "+ Add Row".

    // Initial Fetch
    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoading(true);
                const [custData, siteData] = await Promise.all([
                    customerService.getAll().catch(() => []),
                    siteService.getAll().catch(() => [])
                ]);
                setCustomers(custData);
                setSites(siteData);

                if (hasId) {
                    let quote;
                    try {
                        quote = await quotationService.getQuotationById(Number(id));
                    } catch (err: any) {
                        const msg = err?.response?.data?.error || err?.response?.data?.Error || "Quotation not found.";
                        toast.error(msg);
                        navigate('/quotations');
                        return;
                    }
                    // Extract config percentages from saved calculation breakdown
                    const firstImported = quote.items.find(i => i.itemType === "Imported" && i.calculationBreakdown);
                    let savedCostFactor = 60, savedImportPct = 13.75, savedTransPct = 2, savedProfitPct = 15, savedExchangeRate = 300;
                    if (firstImported?.calculationBreakdown) {
                        try {
                            const bd = JSON.parse(firstImported.calculationBreakdown);
                            if (bd.costFactorPct) savedCostFactor = bd.costFactorPct;
                            if (bd.importationPct) savedImportPct = bd.importationPct;
                            if (bd.transportationPct) savedTransPct = bd.transportationPct;
                            if (bd.profitPct) savedProfitPct = bd.profitPct;
                            if (bd.exchangeRate) savedExchangeRate = bd.exchangeRate;
                        } catch {}
                    }

                    setFormData(prev => ({
                        ...prev,
                        customerId: quote.customerId,
                        siteId: quote.siteName ? siteData.find(s => s.name === quote.siteName)?.id : undefined,
                        currency: quote.currency,
                        exchangeRate: savedExchangeRate,
                        gstPercentage: quote.gstPercentage,
                        incomeTaxPercentage: quote.incomeTaxPercentage,
                        adjustment: quote.adjustment,
                        quoteMode: quote.quoteMode || "Local",
                        supplyColumnMode: quote.supplyColumnMode || "Both",
                        projectCode: quote.projectCode || "FPS",
                        quoteHeadline: quote.quoteHeadline || "",
                        costFactorPct: savedCostFactor,
                        importationPct: savedImportPct,
                        transportationPct: savedTransPct,
                        profitPct: savedProfitPct,
                    }));

                    setShowImported(quote.items.some(i => i.itemType === "Imported"));
                    setShowLocal(quote.items.some(i => i.itemType === "Local"));
                    setShowServices(quote.items.some(i => i.itemType === "Service"));

                    const imp: UiItem[] = [];
                    const loc: UiItem[] = [];
                    const srv: UiItem[] = [];

                    // Fetch previously selected products to display their names correctly
                    const productIds = quote.items.filter(i => i.productId).map(i => i.productId as number);
                    const uniqueIds = Array.from(new Set(productIds));
                    const loadedProducts = await Promise.all(uniqueIds.map(pid => productService.getById(pid).catch(() => null)));
                    const validProducts = loadedProducts.filter(p => p !== null) as ProductDto[];

                    quote.items.forEach(i => {
                        const p = validProducts.find((prod) => prod.id === i.productId);
                        
                        // Determine if unit is custom
                        const isCustomUnit = i.unit && !UNIT_OPTIONS.includes(i.unit) && i.unit !== "Custom";

                        // For custom-named items (no product found), use the saved description as serviceName
                        // Also use it if the saved description differs from the product name (user edited the name)
                        let restoredServiceName = i.serviceName;
                        if (!p && i.description && i.itemType !== "Service") {
                            restoredServiceName = i.description;
                        } else if (p && i.description && i.description !== p.name && i.description !== p.description) {
                            restoredServiceName = i.description;
                        }
                        
                        let uiItem: UiItem = {
                            id: Math.random().toString(36).substr(2, 9),
                            productId: i.productId,
                            quantity: i.quantity,
                            itemType: i.itemType,
                            product: p,
                            unitPrice: i.unitPrice,
                            lineTotal: i.lineTotal,
                            serviceName: restoredServiceName,
                            servicePrice: i.originalPrice,
                            originalPrice: i.originalPrice,
                            calcBreakdown: i.calculationBreakdown ? JSON.parse(i.calculationBreakdown) : null,
                            unit: isCustomUnit ? "Custom" : (i.unit || ""),
                            unitQty: i.unitQty || 0,
                            customUnit: isCustomUnit ? i.unit : "",
                        };
                        // For imported items: re-derive calculations from saved originalPrice
                        if (i.itemType === "Imported" && i.originalPrice > 0) {
                            uiItem = { ...uiItem, originalPrice: i.originalPrice };
                            uiItem = {
                                ...uiItem,
                                ...((() => {
                                    const base = i.originalPrice;
                                    const costPricePKR = base * savedExchangeRate;
                                    const negotiatedCost = costPricePKR * (savedCostFactor / 100);
                                    const impCharge = negotiatedCost * (savedImportPct / 100);
                                    const transCharge = negotiatedCost * (savedTransPct / 100);
                                    const profCharge = negotiatedCost * (savedProfitPct / 100);
                                    const finalPrice = negotiatedCost + impCharge + transCharge + profCharge;
                                    return {
                                        unitPrice: finalPrice,
                                        lineTotal: finalPrice * i.quantity,
                                        calcBreakdown: {
                                            originalPrice: base, exchangeRate: savedExchangeRate, costPricePKR,
                                            costFactorPct: savedCostFactor, negotiatedCost,
                                            importationPct: savedImportPct, importationCharge: impCharge,
                                            transportationPct: savedTransPct, transportationCharge: transCharge,
                                            profitPct: savedProfitPct, profitCharge: profCharge, finalPrice
                                        }
                                    };
                                })())
                            };
                        }
                        
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
    }, [id, hasId, leadIdParam]);

    // Recalculate imported items when config changes
    useEffect(() => {
        if (importedItems.length > 0) {
            setImportedItems(prev => prev.map(item => calculateImportedItem(item, formData)));
        }
    }, [formData.costFactorPct, formData.importationPct, formData.transportationPct, formData.profitPct, formData.exchangeRate]);

    /* ─── Calculation pipeline (matches Excel & Backend exactly) ─── */
    // basePrice param allows edit-mode to force a saved original price instead of reading from product catalog
    const calculateImportedItem = (item: UiItem, config: Omit<CreateQuotationDto, 'items'>, forcedBasePrice?: number): UiItem => {
         if (item.isManualFinalPrice) {
             return {
                 ...item,
                 lineTotal: item.unitPrice * item.quantity
             };
         }
         // Use forced price (edit restore), then item.originalPrice already set, then product.price (the USD list price shown as $ in the catalog)
         const basePrice = forcedBasePrice ?? item.originalPrice ?? (item.product?.price ?? 0);
         if (!basePrice || basePrice === 0) return item;
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
                 costFactorPct: config.costFactorPct,
                 negotiatedCost,
                 importationPct: config.importationPct,
                 importationCharge: impCharge,
                 transportationPct: config.transportationPct,
                 transportationCharge: transCharge,
                 profitPct: config.profitPct,
                 profitCharge: profCharge,
                 finalPrice
             }
         };
    };

    const handleAddImported = () => {
        setImportedItems([...importedItems, makeEmptyRow("Imported")]);
    };
    
    const handleAddLocal = () => {
        setLocalItems([...localItems, makeEmptyRow("Local")]);
    };

    const handleAddService = () => {
        setServiceItems([...serviceItems, makeEmptyRow("Service")]);
    };

    /* ─── Resolve unit for payload ─── */
    const resolveUnit = (item: UiItem) => {
        if (item.unit === "Custom" && item.customUnit) return item.customUnit;
        return item.unit || "";
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
             // Accept items that have a product OR a custom name typed in
             const valid = importedItems.filter(i => (i.productId && i.productId > 0) || (i.serviceName && i.serviceName.trim() !== ""));
             payloadItems.push(...valid.map(i => ({
                 productId: (i.productId && i.productId > 0) ? i.productId : null,
                 quantity: i.quantity,
                 itemType: "Imported",
                 serviceName: i.serviceName || undefined,
                 overridePrice: i.originalPrice,
                 finalPriceOverride: i.isManualFinalPrice ? i.unitPrice : undefined,
                 unit: resolveUnit(i),
                 unitQty: i.unitQty || 0
             })));
        }
        if (showLocal) {
             const valid = localItems.filter(i => (i.productId && i.productId > 0) || (i.serviceName && i.serviceName.trim() !== ""));
             payloadItems.push(...valid.map(i => ({
                 productId: (i.productId && i.productId > 0) ? i.productId : null,
                 quantity: i.quantity,
                 itemType: "Local",
                 serviceName: i.serviceName || undefined,
                 manualCommissionPct: i.manualCommissionPct,
                 overridePrice: i.unitPrice,
                 unit: resolveUnit(i),
                 unitQty: i.unitQty || 0
             })));
        }
        if (showServices) {
             const valid = serviceItems.filter(i => i.serviceName && i.serviceName.trim() !== "");
             payloadItems.push(...valid.map(i => ({ quantity: i.quantity, itemType: "Service", serviceName: i.serviceName, servicePrice: i.servicePrice, unit: resolveUnit(i), unitQty: i.unitQty || 0 })));
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

            if (isReviseMode) {
                payload.reviseQuoteId = Number(id);
            }

            if (isEditMode || isReviseMode) {
                await quotationService.updateQuotation(Number(id), payload);
                toast.success(isReviseMode ? "Quotation revised successfully" : "Quotation updated successfully");
            } else {
                await quotationService.createQuotation(payload);
                toast.success("Quotation created successfully");
            }
            navigate('/quotations');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.response?.data?.Error || "Error saving quotation");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-24"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

    const availableSites = sites.filter(s => s.customerId === formData.customerId);

    /* ─── Shared input style ──────────────────────────────────── */
    const inputCls = "w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-colors";
    const selectCls = inputCls + " appearance-none";
    const tinyInputCls = "w-16 bg-background text-foreground border border-border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50";

    /* ─── Service name display with edit ─── */
    const ServiceNameDisplay = ({ item, idx, list }: { item: UiItem, idx: number, list: "imported" | "local" | "service" }) => {
        const isEditing = editingServiceName?.list === list && editingServiceName?.index === idx;
        const setItems = list === "imported" ? setImportedItems : list === "local" ? setLocalItems : setServiceItems;
        const items = list === "imported" ? importedItems : list === "local" ? localItems : serviceItems;
        
        const displayName = item.serviceName || (item.product?.name ? item.product.name : "");
        
        if (isEditing) {
            return (
                <input 
                    type="text"
                    className={inputCls}
                    value={item.serviceName !== undefined ? item.serviceName : (item.product ? item.product.name : "")}
                    autoFocus
                    placeholder="Enter custom service name..."
                    onBlur={() => setEditingServiceName(null)}
                    onKeyDown={e => { if (e.key === 'Enter') setEditingServiceName(null); }}
                    onChange={e => {
                        const newArr = [...items];
                        newArr[idx] = { ...newArr[idx], serviceName: e.target.value };
                        setItems(newArr as any);
                    }}
                />
            );
        }
        
        return (
            <div className="flex items-center justify-between w-full min-w-0 bg-background border border-input rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-primary/50 transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    setEditingServiceName({ list, index: idx });
                }}>
                <span className="truncate text-foreground font-medium">{displayName || "Tap to enter service name..."}</span>
                <button type="button" className="p-1 shrink-0 text-muted-foreground hover:text-primary transition-colors" title="Edit Service Name">
                    <Pencil className="h-4 w-4" />
                </button>
            </div>
        );
    };
    /* ─── Mobile card renderer for items ─── */
    const renderImportedCard = (item: UiItem, idx: number) => (
        <div key={item.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center w-full gap-1.5">
                <input 
                    type="text" 
                    className={inputCls + " flex-1 min-w-0"} 
                    placeholder="Custom product name..."
                    value={item.serviceName !== undefined ? item.serviceName : (item.product ? `${item.product.name}` : "")}
                    onChange={e => {
                        const newArr = [...importedItems];
                        newArr[idx] = { ...newArr[idx], serviceName: e.target.value };
                        setImportedItems(newArr);
                    }}
                    onBlur={e => handleCustomProductNameBlur(e.target.value, item.quantity)}
                />
                <button
                    type="button"
                    onClick={() => setProductModalTarget({ list: "imported", index: idx })}
                    className="p-2 bg-secondary border border-border rounded-md hover:bg-secondary/80 shrink-0 flex items-center justify-center"
                    title="Browse Catalog"
                >
                    <Search className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-muted-foreground">Unit</label>
                    <div className="flex flex-col gap-1 mt-1">
                        <select className={selectCls + " !py-1.5 !text-xs"} value={item.unit || ""} onChange={e => {
                            const newArr = [...importedItems];
                            newArr[idx] = { ...newArr[idx], unit: e.target.value, customUnit: e.target.value === "Custom" ? newArr[idx].customUnit : "" };
                            setImportedItems(newArr);
                        }}>
                            <option value="">Select unit...</option>
                            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        {item.unit === "Custom" && (
                            <input type="text" placeholder="Custom unit..." className={inputCls + " !py-1 !text-xs"} value={item.customUnit || ""} onChange={e => {
                                const newArr = [...importedItems];
                                newArr[idx] = { ...newArr[idx], customUnit: e.target.value };
                                setImportedItems(newArr);
                            }}/>
                        )}
                        <input type="number" step="any" min="0" placeholder="Qty (e.g. 20)" className={inputCls + " !py-1 !text-xs"} value={item.unitQty || ""} onChange={e => {
                            const newArr = [...importedItems];
                            newArr[idx] = { ...newArr[idx], unitQty: Number(e.target.value) };
                            setImportedItems(newArr);
                        }}/>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Qty</label>
                    <input type="number" className={inputCls + " !py-1.5"} min="1" value={item.quantity} onChange={e => {
                        const newArr = [...importedItems];
                        newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * newArr[idx].unitPrice };
                        setImportedItems(newArr);
                    }}/>
                </div>
            </div>
            <div>
                <label className="text-xs text-muted-foreground">Base (USD)</label>
                <input type="number" step="any" className={inputCls + " !py-1.5"} min="0" value={item.originalPrice||0} onChange={e => {
                    const newArr = [...importedItems];
                    newArr[idx] = { ...newArr[idx], originalPrice: Number(e.target.value) };
                    setImportedItems(newArr.map(x => calculateImportedItem(x, formData)));
                }}/>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {item.calcBreakdown && (
                        <button type="button" onClick={() => setModalBreakdown(item.calcBreakdown)} className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors" title="View calculations">
                            <Calculator className="h-4 w-4 text-blue-500"/>
                        </button>
                    )}
                    <input 
                        type="number" 
                        step="any" 
                        className={inputCls + " !px-2 !py-1 text-right w-24 text-sm font-medium"} 
                        min="0" 
                        value={item.unitPrice || 0} 
                        onChange={e => {
                            const newArr = [...importedItems];
                            newArr[idx] = { 
                                ...newArr[idx], 
                                unitPrice: Number(e.target.value), 
                                lineTotal: Number(e.target.value) * newArr[idx].quantity,
                                isManualFinalPrice: true 
                            };
                            setImportedItems(newArr);
                        }}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
                    <button type="button" onClick={() => setImportedItems(importedItems.filter(x=>x.id !== item.id))} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive"/>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderLocalCard = (item: UiItem, idx: number) => (
        <div key={item.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center w-full gap-1.5">
                <input 
                    type="text" 
                    className={inputCls + " flex-1 min-w-0"} 
                    placeholder="Custom product name..."
                    value={item.serviceName !== undefined ? item.serviceName : (item.product ? `${item.product.name}` : "")}
                    onChange={e => {
                        const newArr = [...localItems];
                        newArr[idx] = { ...newArr[idx], serviceName: e.target.value };
                        setLocalItems(newArr);
                    }}
                    onBlur={e => handleCustomProductNameBlur(e.target.value, item.quantity)}
                />
                <button
                    type="button"
                    onClick={() => setProductModalTarget({ list: "local", index: idx })}
                    className="p-2 bg-secondary border border-border rounded-md hover:bg-secondary/80 shrink-0 flex items-center justify-center"
                    title="Browse Catalog"
                >
                    <Search className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-muted-foreground">Unit</label>
                    <div className="flex flex-col gap-1 mt-1">
                        <select className={selectCls + " !py-1.5 !text-xs"} value={item.unit || ""} onChange={e => {
                            const newArr = [...localItems];
                            newArr[idx] = { ...newArr[idx], unit: e.target.value, customUnit: e.target.value === "Custom" ? newArr[idx].customUnit : "" };
                            setLocalItems(newArr);
                        }}>
                            <option value="">Select unit...</option>
                            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        {item.unit === "Custom" && (
                            <input type="text" placeholder="Custom unit..." className={inputCls + " !py-1 !text-xs"} value={item.customUnit || ""} onChange={e => {
                                const newArr = [...localItems];
                                newArr[idx] = { ...newArr[idx], customUnit: e.target.value };
                                setLocalItems(newArr);
                            }}/>
                        )}
                        <input type="number" step="any" min="0" placeholder="Qty (e.g. 20)" className={inputCls + " !py-1 !text-xs"} value={item.unitQty || ""} onChange={e => {
                            const newArr = [...localItems];
                            newArr[idx] = { ...newArr[idx], unitQty: Number(e.target.value) };
                            setLocalItems(newArr);
                        }}/>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Qty</label>
                    <input type="number" className={inputCls + " !py-1.5"} min="1" value={item.quantity} onChange={e => {
                        const newArr = [...localItems];
                        newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * newArr[idx].unitPrice * (1 - (newArr[idx].manualCommissionPct||0)/100) };
                        setLocalItems(newArr);
                    }}/>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-muted-foreground">Price (PKR)</label>
                    <input type="number" step="any" className={inputCls + " !py-1.5"} min="0" value={item.unitPrice||0} onChange={e => {
                        const newArr = [...localItems];
                        newArr[idx] = { ...newArr[idx], unitPrice: Number(e.target.value), lineTotal: Number(e.target.value) * newArr[idx].quantity * (1 - (newArr[idx].manualCommissionPct||0)/100) };
                        setLocalItems(newArr);
                    }}/>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Disc%</label>
                    <input type="number" step="any" className={inputCls + " !py-1.5"} min="0" max="100" value={item.manualCommissionPct||""} placeholder="0" onChange={e => {
                        const newArr = [...localItems];
                        newArr[idx] = { ...newArr[idx], manualCommissionPct: Number(e.target.value), lineTotal: newArr[idx].quantity * newArr[idx].unitPrice * (1 - Number(e.target.value)/100) };
                        setLocalItems(newArr);
                    }}/>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
                <button type="button" onClick={() => setLocalItems(localItems.filter(x=>x.id !== item.id))} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4 text-destructive"/>
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-32">
            <div className="flex items-center space-x-4 mb-6 md:mb-8">
                <button onClick={() => navigate('/quotations')} className="p-2 hover:bg-secondary/50 rounded-lg text-muted-foreground"><ArrowLeft className="h-5 w-5"/></button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        {isEditMode ? "Edit Quotation" : isReviseMode ? "Revise Quotation" : "Create Quotation"}
                    </h1>
                    <p className="text-muted-foreground text-sm">Select sections and build your quote</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                {/* ── 1. SECTIONS TOGGLE ── */}
                <div className="bg-secondary/20 border border-border/50 rounded-2xl p-4 md:p-6 shadow-md flex justify-center gap-3 md:gap-6 flex-wrap">
                     {[
                         { label: "Imported Items", checked: showImported, onChange: setShowImported, color: "blue" },
                         { label: "Local Items", checked: showLocal, onChange: setShowLocal, color: "emerald" },
                         { label: "Services", checked: showServices, onChange: setShowServices, color: "purple" },
                     ].map(opt => (
                         <label key={opt.label} className={`flex items-center gap-2 md:gap-3 cursor-pointer p-3 md:p-4 rounded-xl border-2 transition-all text-sm md:text-base ${opt.checked ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border hover:border-primary/40'}`}>
                             <input type="checkbox" className="hidden" checked={opt.checked} onChange={e => opt.onChange(e.target.checked)}/>
                             <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${opt.checked ? 'bg-primary border-primary' : 'border-muted-foreground/50'}`}>
                                 {opt.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                             </div>
                             <span className="font-semibold text-foreground">{opt.label}</span>
                         </label>
                     ))}
                </div>

                {/* ── HEADER INFO ── */}
                <div className="bg-secondary/30 border border-border/50 rounded-2xl p-4 md:p-6 shadow-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                     <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Customer *</label>
                        <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: Number(e.target.value), siteId: 0})} className={selectCls}>
                            <option value={0} disabled>Select...</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Site</label>
                        <select value={formData.siteId || 0} onChange={e => setFormData({...formData, siteId: Number(e.target.value)||undefined})} className={selectCls}>
                             <option value={0}>No Site</option>
                             {availableSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                     <div>
                         <label className="text-xs font-semibold text-muted-foreground block mb-1.5">PDF Supply Column</label>
                         <select value={formData.supplyColumnMode} onChange={e => setFormData({...formData, supplyColumnMode: e.target.value})} className={selectCls}>
                            <option value="Both">Both (Imported + Local)</option>
                            <option value="ImportedOnly">Imported Items &amp; Services Only</option>
                            <option value="LocalOnly">Local Items &amp; Services Only</option>
                         </select>
                     </div>
                     <div>
                         <label className="text-xs font-semibold text-primary block mb-1.5">Exchange Rate (USD → PKR)</label>
                         <input type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})} className={inputCls + " !border-primary/40 focus:!ring-primary/30"} />
                     </div>
                </div>

                {/* ── PROJECT CODE & HEADLINE ── */}
                <div className="bg-secondary/30 border border-border/50 rounded-2xl p-4 md:p-6 shadow-md grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Project Code (Quote Suffix)</label>
                        <input type="text" placeholder="FPS" value={formData.projectCode || ""} onChange={e => setFormData({...formData, projectCode: e.target.value.toUpperCase()})} className={inputCls} />
                        <p className="text-xs text-muted-foreground mt-1">Quote # will be: MTQ-AA#####-{formData.projectCode || "FPS"}-R0</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">PDF Headline (auto-generated if blank)</label>
                        <input type="text" placeholder="e.g. Fire Fighting Equipments for Marka-e-Haq Monument" value={formData.quoteHeadline || ""} onChange={e => setFormData({...formData, quoteHeadline: e.target.value})} className={inputCls} />
                    </div>
                </div>

                {/* ── IMPORTED SECTION ── */}
                {showImported && (
                     <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-xl animate-in slide-in-from-bottom-4 relative">
                         <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl" />
                         <div className="flex justify-between items-center mb-4 pl-3">
                             <h3 className="text-base md:text-lg font-bold text-blue-500 dark:text-blue-400 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                 Imported Items
                             </h3>
                             <button type="button" onClick={handleAddImported} className="text-sm bg-blue-500/10 text-blue-500 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-blue-500/20 transition-colors">
                                 <Plus className="w-4 h-4 mr-1"/> Add Row
                             </button>
                         </div>

                         {/* Config bar */}
                         <div className="flex gap-3 md:gap-4 mb-4 text-xs bg-primary/5 border border-border p-3 rounded-xl ml-3 flex-wrap">
                             <div className="flex items-center gap-1 text-muted-foreground">Cost Factor %: <input type="number" step="any" className={tinyInputCls} value={formData.costFactorPct} onChange={e=>setFormData({...formData, costFactorPct: Number(e.target.value)})} /></div>
                             <div className="flex items-center gap-1 text-muted-foreground">Import %: <input type="number" step="any" className={tinyInputCls} value={formData.importationPct} onChange={e=>setFormData({...formData, importationPct: Number(e.target.value)})} /></div>
                             <div className="flex items-center gap-1 text-muted-foreground">Transport %: <input type="number" step="any" className={tinyInputCls} value={formData.transportationPct} onChange={e=>setFormData({...formData, transportationPct: Number(e.target.value)})} /></div>
                             <div className="flex items-center gap-1 text-muted-foreground">Profit %: <input type="number" step="any" className={tinyInputCls} value={formData.profitPct} onChange={e=>setFormData({...formData, profitPct: Number(e.target.value)})} /></div>
                         </div>

                         {/* Desktop table */}
                         <div className="hidden md:block overflow-x-auto ml-3">
                         <table className="w-full text-sm table-fixed">
                             <thead className="text-xs text-muted-foreground uppercase"><tr className="border-b border-border/60"><th className="text-left py-2 pr-2 w-[30%]">Product</th><th className="w-[100px] text-center">Unit</th><th className="w-16 text-center">Qty</th><th className="w-24 text-right">Base (USD)</th><th className="w-36 text-right">Final (PKR)</th><th className="w-28 text-right">Total</th><th className="w-10"></th></tr></thead>
                             <tbody>
                                 {importedItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/30">
                                         <td className="py-2 pr-2">
                                              <div className="flex items-center w-full gap-1.5">
                                                  <input 
                                                      type="text" 
                                                      className={inputCls + " !py-1.5 flex-1 min-w-0 text-sm"} 
                                                      placeholder="Custom product name..."
                                                      value={item.serviceName !== undefined ? item.serviceName : (item.product ? `${item.product.name} ${item.product.itemCode ? `(${item.product.itemCode})` : ""}` : "")}
                                                      onChange={e => {
                                                          const newArr = [...importedItems];
                                                          newArr[idx] = { ...newArr[idx], serviceName: e.target.value };
                                                          setImportedItems(newArr);
                                                      }}
                                                      onBlur={e => handleCustomProductNameBlur(e.target.value, item.quantity)}
                                                  />
                                                  <button
                                                      type="button"
                                                      onClick={() => setProductModalTarget({ list: "imported", index: idx })}
                                                      className="p-1.5 bg-secondary border border-border rounded-md hover:bg-secondary/80 shrink-0 flex items-center justify-center"
                                                      title="Browse Catalog"
                                                  >
                                                      <Search className="h-4 w-4 text-muted-foreground" />
                                                  </button>
                                              </div>
                                         </td>
                                         <td className="px-1">
                                              <div className="flex flex-col gap-1">
                                                  <select className={selectCls + " !py-1.5 !text-xs"} value={item.unit || ""} onChange={e => {
                                                      const newArr = [...importedItems];
                                                      newArr[idx] = { ...newArr[idx], unit: e.target.value, customUnit: e.target.value === "Custom" ? newArr[idx].customUnit : "" };
                                                      setImportedItems(newArr);
                                                  }}>
                                                      <option value="">Select unit...</option>
                                                      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                                                  </select>
                                                  {item.unit === "Custom" && (
                                                      <input type="text" placeholder="Custom unit..." className={inputCls + " !py-1 !text-xs"} value={item.customUnit || ""} onChange={e => {
                                                          const newArr = [...importedItems];
                                                          newArr[idx] = { ...newArr[idx], customUnit: e.target.value };
                                                          setImportedItems(newArr);
                                                      }}/>
                                                  )}
                                                  <input type="number" step="any" min="0" placeholder="Qty (e.g. 20)" className={inputCls + " !py-1 !text-xs"} value={item.unitQty || ""} onChange={e => {
                                                      const newArr = [...importedItems];
                                                      newArr[idx] = { ...newArr[idx], unitQty: Number(e.target.value) };
                                                      setImportedItems(newArr);
                                                  }}/>
                                              </div>
                                         </td>
                                         <td className="px-1">
                                              <input type="number" className={inputCls + " !px-2 !py-1.5 text-center"} min="1" value={item.quantity} onChange={e => {
                                                  const newArr = [...importedItems];
                                                  newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * newArr[idx].unitPrice };
                                                  setImportedItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="px-1">
                                              <input type="number" step="any" className={inputCls + " !px-2 !py-1.5 text-right"} min="0" value={item.originalPrice||0} onChange={e => {
                                                  const newArr = [...importedItems];
                                                  newArr[idx] = { ...newArr[idx], originalPrice: Number(e.target.value) };
                                                  setImportedItems(newArr.map(x => calculateImportedItem(x, formData)));
                                              }}/>
                                         </td>
                                         <td className="text-right font-medium text-foreground">
                                             <div className="flex items-center justify-end gap-1.5">
                                                 {item.calcBreakdown && (
                                                     <button type="button" onClick={() => setModalBreakdown(item.calcBreakdown)} className="p-1 rounded hover:bg-primary/10 transition-colors" title="View calculation breakdown">
                                                         <Calculator className="h-4 w-4 text-blue-400 hover:text-blue-500"/>
                                                     </button>
                                                 )}
                                                 <input 
                                                     type="number" 
                                                     step="any" 
                                                     className={inputCls + " !px-2 !py-1.5 text-right w-24"} 
                                                     min="0" 
                                                     value={item.unitPrice || 0} 
                                                     onChange={e => {
                                                         const newArr = [...importedItems];
                                                         newArr[idx] = { 
                                                             ...newArr[idx], 
                                                             unitPrice: Number(e.target.value), 
                                                             lineTotal: Number(e.target.value) * newArr[idx].quantity,
                                                             isManualFinalPrice: true 
                                                         };
                                                         setImportedItems(newArr);
                                                     }}
                                                 />
                                             </div>
                                         </td>
                                         <td className="text-right font-bold text-foreground">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                         <td className="text-center">
                                             <button type="button" onClick={() => setImportedItems(importedItems.filter(x=>x.id !== item.id))} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                                                 <Trash2 className="w-4 h-4 text-destructive"/>
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         </div>

                         {/* Mobile cards */}
                         <div className="md:hidden space-y-3 ml-3">
                             {importedItems.map((item, idx) => renderImportedCard(item, idx))}
                         </div>

                         {importedItems.length > 0 && (
                             <div className="mt-3 ml-3 text-right text-sm font-bold text-foreground border-t border-border/40 pt-3 pr-4 md:pr-14">
                                 Section Total: {importedItems.reduce((s, i) => s + i.lineTotal, 0).toLocaleString(undefined, {maximumFractionDigits:2})} PKR
                             </div>
                         )}
                     </div>
                )}

                {/* ── LOCAL SECTION ── */}
                {showLocal && (
                     <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-xl animate-in slide-in-from-bottom-4 relative">
                         <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl" />
                         <div className="flex justify-between items-center mb-4 pl-3">
                             <h3 className="text-base md:text-lg font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                 Local Items
                             </h3>
                             <button type="button" onClick={handleAddLocal} className="text-sm bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-emerald-500/20 transition-colors">
                                 <Plus className="w-4 h-4 mr-1"/> Add Row
                             </button>
                         </div>
                         {/* Desktop table */}
                         <div className="hidden md:block overflow-x-auto ml-3">
                         <table className="w-full text-sm table-fixed">
                             <thead className="text-xs text-muted-foreground uppercase"><tr className="border-b border-border/60"><th className="text-left py-2 pr-2 w-[30%]">Product</th><th className="w-[100px] text-center">Unit</th><th className="w-16 text-center">Qty</th><th className="w-24 text-right">Price (PKR)</th><th className="w-20 text-center">Disc%</th><th className="w-28 text-right">Total</th><th className="w-10"></th></tr></thead>
                             <tbody>
                                 {localItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/30">
                                         <td className="py-2 pr-2">
                                              <div className="flex items-center w-full gap-1.5">
                                                  <input 
                                                      type="text" 
                                                      className={inputCls + " !py-1.5 flex-1 min-w-0 text-sm"} 
                                                      placeholder="Custom product name..."
                                                      value={item.serviceName !== undefined ? item.serviceName : (item.product ? `${item.product.name} ${item.product.itemCode ? `(${item.product.itemCode})` : ""}` : "")}
                                                      onChange={e => {
                                                          const newArr = [...localItems];
                                                          newArr[idx] = { ...newArr[idx], serviceName: e.target.value };
                                                          setLocalItems(newArr);
                                                      }}
                                                      onBlur={e => handleCustomProductNameBlur(e.target.value, item.quantity)}
                                                  />
                                                  <button
                                                      type="button"
                                                      onClick={() => setProductModalTarget({ list: "local", index: idx })}
                                                      className="p-1.5 bg-secondary border border-border rounded-md hover:bg-secondary/80 shrink-0 flex items-center justify-center"
                                                      title="Browse Catalog"
                                                  >
                                                      <Search className="h-4 w-4 text-muted-foreground" />
                                                  </button>
                                              </div>
                                         </td>
                                         <td className="px-1">
                                              <div className="flex flex-col gap-1">
                                                  <select className={selectCls + " !py-1.5 !text-xs"} value={item.unit || ""} onChange={e => {
                                                      const newArr = [...localItems];
                                                      newArr[idx] = { ...newArr[idx], unit: e.target.value, customUnit: e.target.value === "Custom" ? newArr[idx].customUnit : "" };
                                                      setLocalItems(newArr);
                                                  }}>
                                                      <option value="">Select unit...</option>
                                                      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                                                  </select>
                                                  {item.unit === "Custom" && (
                                                      <input type="text" placeholder="Custom unit..." className={inputCls + " !py-1 !text-xs"} value={item.customUnit || ""} onChange={e => {
                                                          const newArr = [...localItems];
                                                          newArr[idx] = { ...newArr[idx], customUnit: e.target.value };
                                                          setLocalItems(newArr);
                                                      }}/>
                                                  )}
                                                  <input type="number" step="any" min="0" placeholder="Qty (e.g. 20)" className={inputCls + " !py-1 !text-xs"} value={item.unitQty || ""} onChange={e => {
                                                          const newArr = [...localItems];
                                                          newArr[idx] = { ...newArr[idx], unitQty: Number(e.target.value) };
                                                          setLocalItems(newArr);
                                                  }}/>
                                              </div>
                                         </td>
                                         <td className="px-1">
                                              <input type="number" className={inputCls + " !px-2 !py-1.5 text-center"} min="1" value={item.quantity} onChange={e => {
                                                  const newArr = [...localItems];
                                                  newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * newArr[idx].unitPrice * (1 - (newArr[idx].manualCommissionPct||0)/100) };
                                                  setLocalItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="px-1">
                                              <input type="number" step="any" className={inputCls + " !px-2 !py-1.5 text-right"} min="0" value={item.unitPrice||0} onChange={e => {
                                                  const newArr = [...localItems];
                                                  newArr[idx] = { ...newArr[idx], unitPrice: Number(e.target.value), lineTotal: Number(e.target.value) * newArr[idx].quantity * (1 - (newArr[idx].manualCommissionPct||0)/100) };
                                                  setLocalItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="px-1">
                                              <input type="number" step="any" className={inputCls + " !px-2 !py-1.5 text-center"} min="0" max="100" value={item.manualCommissionPct||""} placeholder="0" onChange={e => {
                                                  const newArr = [...localItems];
                                                  newArr[idx] = { ...newArr[idx], manualCommissionPct: Number(e.target.value), lineTotal: newArr[idx].quantity * newArr[idx].unitPrice * (1 - Number(e.target.value)/100) };
                                                  setLocalItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="text-right font-bold text-foreground">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                         <td className="text-center">
                                             <button type="button" onClick={() => setLocalItems(localItems.filter(x=>x.id !== item.id))} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                                                 <Trash2 className="w-4 h-4 text-destructive"/>
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         </div>

                         {/* Mobile cards */}
                         <div className="md:hidden space-y-3 ml-3">
                             {localItems.map((item, idx) => renderLocalCard(item, idx))}
                         </div>

                         {localItems.length > 0 && (
                             <div className="mt-3 ml-3 text-right text-sm font-bold text-foreground border-t border-border/40 pt-3 pr-4 md:pr-14">
                                 Section Total: {localItems.reduce((s, i) => s + i.lineTotal, 0).toLocaleString(undefined, {maximumFractionDigits:2})} PKR
                             </div>
                         )}
                     </div>
                )}

                {/* ── SERVICES SECTION ── */}
                {showServices && (
                     <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-xl animate-in slide-in-from-bottom-4 relative">
                         <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl" />
                         <div className="flex justify-between items-center mb-4 pl-3">
                             <h3 className="text-base md:text-lg font-bold text-purple-500 dark:text-purple-400 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                 Services
                             </h3>
                             <button type="button" onClick={handleAddService} className="text-sm bg-purple-500/10 text-purple-500 dark:text-purple-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-purple-500/20 transition-colors">
                                 <Plus className="w-4 h-4 mr-1"/> Add Row
                             </button>
                         </div>
                         {/* Desktop table */}
                         <div className="hidden md:block overflow-x-auto ml-3">
                         <table className="w-full text-sm table-fixed">
                             <thead className="text-xs text-muted-foreground uppercase"><tr className="border-b border-border/60"><th className="text-left py-2 pr-2">Service Name</th><th className="w-16 text-center">Qty</th><th className="w-28 text-right">Price (PKR)</th><th className="w-28 text-right">Total</th><th className="w-10"></th></tr></thead>
                             <tbody>
                                 {serviceItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/30">
                                         <td className="py-2 pr-2">
                                              <ServiceNameDisplay item={item} idx={idx} list="service" />
                                         </td>
                                         <td className="px-1">
                                              <input type="number" className={inputCls + " !px-2 !py-1.5 text-center"} min="1" value={item.quantity} onChange={e => {
                                                  const newArr = [...serviceItems];
                                                  newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * (newArr[idx].servicePrice||0) };
                                                  setServiceItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="pl-1">
                                              <input type="number" step="any" className={inputCls + " !px-2 !py-1.5 text-right"} min="0" value={item.servicePrice||0} onChange={e => {
                                                  const newArr = [...serviceItems];
                                                  newArr[idx] = { ...newArr[idx], servicePrice: Number(e.target.value), unitPrice: Number(e.target.value), lineTotal: newArr[idx].quantity * Number(e.target.value) };
                                                  setServiceItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="text-right font-bold text-foreground">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                         <td className="text-center">
                                             <button type="button" onClick={() => setServiceItems(serviceItems.filter(x=>x.id !== item.id))} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                                                 <Trash2 className="w-4 h-4 text-destructive"/>
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         </div>

                         {/* Mobile cards for services */}
                         <div className="md:hidden space-y-3 ml-3">
                             {serviceItems.map((item, idx) => (
                                 <div key={item.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
                                     <ServiceNameDisplay item={item} idx={idx} list="service" />
                                     <div className="grid grid-cols-2 gap-3">
                                         <div><label className="text-xs text-muted-foreground">Qty</label><input type="number" className={inputCls + " !py-1.5"} min="1" value={item.quantity} onChange={e => { const newArr = [...serviceItems]; newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * (newArr[idx].servicePrice||0) }; setServiceItems(newArr); }}/></div>
                                         <div><label className="text-xs text-muted-foreground">Price</label><input type="number" step="any" className={inputCls + " !py-1.5"} min="0" value={item.servicePrice||0} onChange={e => { const newArr = [...serviceItems]; newArr[idx] = { ...newArr[idx], servicePrice: Number(e.target.value), unitPrice: Number(e.target.value), lineTotal: newArr[idx].quantity * Number(e.target.value) }; setServiceItems(newArr); }}/></div>
                                     </div>
                                     <div className="flex items-center justify-between">
                                         <span className="text-sm font-bold text-primary">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
                                         <button type="button" onClick={() => setServiceItems(serviceItems.filter(x=>x.id !== item.id))} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive"/></button>
                                     </div>
                                 </div>
                             ))}
                         </div>

                         {serviceItems.length > 0 && (
                             <div className="mt-3 ml-3 text-right text-sm font-bold text-foreground border-t border-border/40 pt-3 pr-4 md:pr-14">
                                 Section Total: {serviceItems.reduce((s, i) => s + i.lineTotal, 0).toLocaleString(undefined, {maximumFractionDigits:2})} PKR
                             </div>
                         )}
                     </div>
                )}

                {/* ── TAXES AND TOTALS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                     <div className="bg-secondary/30 border border-border/50 rounded-2xl p-4 md:p-6 shadow-md">
                         <h3 className="text-lg font-semibold text-foreground mb-4">Taxes &amp; Adjustments</h3>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             <div>
                                 <label className="text-xs font-semibold text-muted-foreground block mb-1">GST (%)</label>
                                 <input type="number" step="any" className={inputCls} value={formData.gstPercentage} onChange={e => setFormData({...formData, gstPercentage: Number(e.target.value)})}/>
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-muted-foreground block mb-1">Income Tax (%)</label>
                                 <input type="number" step="any" className={inputCls} value={formData.incomeTaxPercentage} onChange={e => setFormData({...formData, incomeTaxPercentage: Number(e.target.value)})}/>
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-muted-foreground block mb-1">Global Discount (−)</label>
                                 <input type="number" step="any" className={inputCls + " !text-destructive"} value={formData.adjustment} onChange={e => setFormData({...formData, adjustment: Number(e.target.value)})}/>
                             </div>
                         </div>
                     </div>
                     <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/50 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col justify-center">
                         <div className="space-y-3">
                             <div className="flex justify-between text-muted-foreground"><span>Sub Total</span><span className="text-foreground font-medium">{totals.subTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                             {formData.gstPercentage > 0 && <div className="flex justify-between text-muted-foreground"><span>GST ({formData.gstPercentage}%)</span><span className="text-foreground">+ {totals.gst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             {formData.incomeTaxPercentage > 0 && <div className="flex justify-between text-muted-foreground"><span>Income Tax ({formData.incomeTaxPercentage}%)</span><span className="text-foreground">+ {totals.income.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             {formData.adjustment > 0 && <div className="flex justify-between text-destructive"><span>Global Discount</span><span>- {formData.adjustment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             
                             <div className="border-t border-border pt-3 flex justify-between items-end">
                                 <span className="text-base md:text-lg font-bold text-foreground">Grand Total</span>
                                 <span className="text-xl md:text-2xl font-black text-primary">{totals.grand.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm font-medium text-muted-foreground">PKR</span></span>
                             </div>
                         </div>

                         <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
                             <button type="button" onClick={() => navigate('/quotations')} className="px-6 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
                             <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg hover:-translate-y-0.5 transition-all font-bold flex items-center justify-center gap-2 hover:shadow-primary/25">
                                 {saving && <Loader2 className="w-4 h-4 animate-spin"/>} {isEditMode ? "Update" : isReviseMode ? "Revise" : "Save Quotation"}
                             </button>
                         </div>
                     </div>
                </div>
            </form>

            {/* ── BREAKDOWN MODAL ── */}
            {modalBreakdown && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setModalBreakdown(null)}>
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-blue-500" />
                                Price Calculation Pipeline
                            </h2>
                        </div>
                        <div className="space-y-3 text-sm font-medium">
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">List Price (USD)</span>
                                <span className="text-foreground">{modalBreakdown.originalPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center bg-primary/5 border border-border p-2 rounded-lg">
                                <span className="text-muted-foreground">Exchange Rate</span>
                                <span className="text-primary font-bold">× {modalBreakdown.exchangeRate}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-muted-foreground">Cost Price (PKR)</span>
                                <span className="text-foreground">{modalBreakdown.costPricePKR?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>

                            <div className="h-px bg-border my-1"></div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Negotiated Cost ({modalBreakdown.costFactorPct}%)</span>
                                <span className="text-foreground">{modalBreakdown.negotiatedCost?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-blue-500 dark:text-blue-400">
                                <span>+ Importation ({modalBreakdown.importationPct}%)</span>
                                <span>{modalBreakdown.importationCharge?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-amber-500 dark:text-amber-400">
                                <span>+ Transport ({modalBreakdown.transportationPct}%)</span>
                                <span>{modalBreakdown.transportationCharge?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-emerald-500 dark:text-emerald-400">
                                <span>+ Profit ({modalBreakdown.profitPct}%)</span>
                                <span>{modalBreakdown.profitCharge?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            
                            <div className="mt-4 bg-primary/10 p-4 rounded-xl flex justify-between items-center border border-primary/20">
                                <span className="font-bold text-foreground">Final Unit Price</span>
                                <span className="text-xl font-black text-primary">{modalBreakdown.finalPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <button onClick={() => setModalBreakdown(null)} className="w-full mt-6 bg-secondary hover:bg-secondary/80 text-foreground py-3 rounded-xl font-semibold transition-colors border border-border">
                            Close
                        </button>
                    </div>
                </div>
            )}

            <ProductSelectionModal
                isOpen={productModalTarget !== null}
                onClose={() => setProductModalTarget(null)}
                onSelect={(p) => {
                    if (productModalTarget?.list === "imported") {
                        const newArr = [...importedItems];
                        const quantity = newArr[productModalTarget.index].quantity || 1;
                        // Use product.price as the USD base price (shown as "$" in the product catalog/selection modal)
                        const listBasePrice = p.price ?? 0;
                        // Build a CLEAN item: explicitly wipe stale originalPrice & calcBreakdown
                        // so that switching products on the same row always recalculates fresh
                        const cleanItem = {
                            ...newArr[productModalTarget.index],
                            originalPrice: undefined,   // clear stale price
                            calcBreakdown: undefined,   // clear stale breakdown
                            unitPrice: 0,
                            lineTotal: 0,
                            productId: p.id,
                            product: p,
                            serviceName: p.name,
                        };
                        // Run the full calculation pipeline with the product's USD list price forced
                        newArr[productModalTarget.index] = calculateImportedItem(cleanItem, formData, listBasePrice);
                        setImportedItems(newArr);
                        
                        setShowServices(true);
                        setServiceItems(prev => {
                            // Replace a blank placeholder row if one exists, otherwise append
                            const blankIdx = prev.findIndex(s => !s.serviceName || s.serviceName.trim() === "");
                            if (prev.some(s => s.serviceName === p.name)) return prev;
                            if (blankIdx !== -1) {
                                const updated = [...prev];
                                updated[blankIdx] = { ...updated[blankIdx], serviceName: p.name, quantity: quantity };
                                return updated;
                            }
                            return [...prev, { ...makeEmptyRow("Service"), serviceName: p.name, quantity: quantity }];
                        });
                    } else if (productModalTarget?.list === "local") {
                        const newArr = [...localItems];
                        const quantity = newArr[productModalTarget.index].quantity || 1;
                        newArr[productModalTarget.index] = { ...newArr[productModalTarget.index], productId: p.id, product: p, serviceName: p.name, unitPrice: p.price, lineTotal: quantity * p.price * (1 - (newArr[productModalTarget.index].manualCommissionPct||0)/100) };
                        setLocalItems(newArr);
                        
                        setShowServices(true);
                        setServiceItems(prev => {
                            const blankIdx = prev.findIndex(s => !s.serviceName || s.serviceName.trim() === "");
                            if (prev.some(s => s.serviceName === p.name)) return prev;
                            if (blankIdx !== -1) {
                                const updated = [...prev];
                                updated[blankIdx] = { ...updated[blankIdx], serviceName: p.name, quantity: quantity };
                                return updated;
                            }
                            return [...prev, { ...makeEmptyRow("Service"), serviceName: p.name, quantity: quantity }];
                        });
                    }
                    setProductModalTarget(null);
                }}
            />

        </div>
    );
};
