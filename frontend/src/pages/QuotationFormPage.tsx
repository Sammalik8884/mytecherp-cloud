import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, Loader2, Search, Calculator, Pencil, X } from "lucide-react";
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
import { AutoResizeTextarea } from "../components/common/AutoResizeTextarea";
import { TermsAndConditionsSection } from "../components/TermsAndConditionsSection";
import { FormPrompt } from "../components/common/FormPrompt";

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
    linkedId?: string;
    remarks?: string;
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
    const [isSubmitted, setIsSubmitted] = useState(false);
    
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
        provincialTaxType: "",
        provincialTaxPercentage: 0,
        adjustment: 0,
        quoteMode: "Local",
        supplyColumnMode: "Both",
        costFactorPct: 60,
        importationPct: 13.75,
        transportationPct: 2,
        profitPct: 15,
        localTransportationPct: 2,
        localProfitPct: 15,
        projectCode: "FPS",
        quoteHeadline: "",
        termsAndConditionsJson: "",
        showStamp: false
    });

    // WHT state — UI-only, not submitted to backend, not on PDF
    const [whtPercentage, setWhtPercentage] = useState<number>(6);

    // Selections for Quote Sections
    const [showImported, setShowImported] = useState(false);
    const [showLocal, setShowLocal] = useState(false);
    const [showImportedServices, setShowImportedServices] = useState(false);
    const [showLocalServices, setShowLocalServices] = useState(false);
    
    // Lists holding our UI items
    const [importedItems, setImportedItems] = useState<UiItem[]>([]);
    const [localItems, setLocalItems] = useState<UiItem[]>([]);
    const [importedServiceItems, setImportedServiceItems] = useState<UiItem[]>([]);
    const [localServiceItems, setLocalServiceItems] = useState<UiItem[]>([]);

    const [deletedImportedServiceIds, setDeletedImportedServiceIds] = useState<Set<string>>(new Set());
    const [deletedLocalServiceIds, setDeletedLocalServiceIds] = useState<Set<string>>(new Set());

    // Breakdown Modal state
    const [modalBreakdown, setModalBreakdown] = useState<any>(null);

    // Product Selection Modal Target
    const [productModalTarget, setProductModalTarget] = useState<{ list: "imported" | "local", index: number } | null>(null);

    // Custom row modal state
    const [customRowModal, setCustomRowModal] = useState<{ isOpen: boolean, listType: "Imported" | "Local" | "ImportedService" | "LocalService" | null, rowIndex: string }>({
        isOpen: false,
        listType: null,
        rowIndex: ""
    });

    const handleOpenProductModal = (target: { list: "imported" | "local", index: number }) => {
        setProductModalTarget(target);
        window.dispatchEvent(new CustomEvent('closeSidebar'));
    };

    // Service name edit state
    const [editingServiceName, setEditingServiceName] = useState<{ list: "imported" | "local" | "service" | "importedService" | "localService", index: number } | null>(null);

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

    // Sync service rows quantities 1-to-1 with their parent product rows
    useEffect(() => {
        if (!showImportedServices) return;
        setImportedServiceItems(prev => {
            let changed = false;
            const next = [...prev];
            
            importedItems.forEach((item) => {
                const serviceIdx = next.findIndex(s => s.linkedId === item.id);
                const defaultName = item.serviceName !== undefined
                    ? item.serviceName
                    : item.product ? `${item.product.name} ${item.product.itemCode ? `(${item.product.itemCode})` : ''}` : '';
                
                if (serviceIdx !== -1) {
                    if (next[serviceIdx].quantity !== item.quantity || next[serviceIdx].referenceNumber !== item.referenceNumber || next[serviceIdx].serviceName !== defaultName) {
                        next[serviceIdx] = { ...next[serviceIdx], quantity: item.quantity, referenceNumber: item.referenceNumber, serviceName: defaultName };
                        changed = true;
                    }
                } else if (!deletedImportedServiceIds.has(item.id)) {
                    next.push({ ...makeEmptyRow('ImportedService'), linkedId: item.id, serviceName: defaultName, quantity: item.quantity, referenceNumber: item.referenceNumber });
                    changed = true;
                }
            });
            
            return changed ? next : prev;
        });
    }, [importedItems, showImportedServices, deletedImportedServiceIds]);

    useEffect(() => {
        if (!showLocalServices) return;
        setLocalServiceItems(prev => {
            let changed = false;
            const next = [...prev];
            
            localItems.forEach((item) => {
                const serviceIdx = next.findIndex(s => s.linkedId === item.id);
                const defaultName = item.serviceName !== undefined
                    ? item.serviceName
                    : item.product ? `${item.product.name} ${item.product.itemCode ? `(${item.product.itemCode})` : ''}` : '';
                
                if (serviceIdx !== -1) {
                    if (next[serviceIdx].quantity !== item.quantity || next[serviceIdx].referenceNumber !== item.referenceNumber || next[serviceIdx].serviceName !== defaultName) {
                        next[serviceIdx] = { ...next[serviceIdx], quantity: item.quantity, referenceNumber: item.referenceNumber, serviceName: defaultName };
                        changed = true;
                    }
                } else if (!deletedLocalServiceIds.has(item.id)) {
                    next.push({ ...makeEmptyRow('LocalService'), linkedId: item.id, serviceName: defaultName, quantity: item.quantity, referenceNumber: item.referenceNumber });
                    changed = true;
                }
            });
            
            return changed ? next : prev;
        });
    }, [localItems, showLocalServices, deletedLocalServiceIds]);

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
                            if (bd.costFactorPct !== undefined) savedCostFactor = bd.costFactorPct;
                            if (bd.importationPct !== undefined) savedImportPct = bd.importationPct;
                            if (bd.transportationPct !== undefined) savedTransPct = bd.transportationPct;
                            if (bd.profitPct !== undefined) savedProfitPct = bd.profitPct;
                            if (bd.exchangeRate !== undefined) savedExchangeRate = bd.exchangeRate;
                        } catch {}
                    }

                    const firstLocal = quote.items.find(i => i.itemType === "Local" && i.calculationBreakdown);
                    let savedLocalTransPct = 2, savedLocalProfitPct = 15;
                    if (firstLocal?.calculationBreakdown) {
                        try {
                            const bd = JSON.parse(firstLocal.calculationBreakdown);
                            if (bd.transportationPct !== undefined) savedLocalTransPct = bd.transportationPct;
                            if (bd.profitPct !== undefined) savedLocalProfitPct = bd.profitPct;
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
                        provincialTaxType: quote.provincialTaxType || "",
                        provincialTaxPercentage: quote.provincialTaxPercentage || 0,
                        adjustment: quote.adjustment,
                        quoteMode: quote.quoteMode || "Local",
                        supplyColumnMode: quote.supplyColumnMode || "Both",
                        projectCode: quote.projectCode || "FPS",
                        quoteHeadline: quote.quoteHeadline || "",
                        boqReferenceNumber: quote.boqReferenceNumber || "",
                        termsAndConditionsJson: quote.termsAndConditionsJson || "",
                        showStamp: quote.showStamp || false,
                        costFactorPct: savedCostFactor,
                        importationPct: savedImportPct,
                        transportationPct: savedTransPct,
                        profitPct: savedProfitPct,
                        localTransportationPct: savedLocalTransPct,
                        localProfitPct: savedLocalProfitPct,
                    }));

                    setShowImported(quote.items.some(i => i.itemType === "Imported"));
                    setShowLocal(quote.items.some(i => i.itemType === "Local"));
                    setShowImportedServices(quote.items.some(i => i.itemType === "ImportedService"));
                    setShowLocalServices(quote.items.some(i => i.itemType === "LocalService" || i.itemType === "Service"));

                    const imp: UiItem[] = [];
                    const loc: UiItem[] = [];
                    const impSrv: UiItem[] = [];
                    const locSrv: UiItem[] = [];

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
                            referenceNumber: i.referenceNumber || "",
                            remarks: i.remarks || "",
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
                        else if (i.itemType === "ImportedService") impSrv.push(uiItem);
                        else locSrv.push(uiItem);
                    });

                    setImportedItems(imp);
                    setLocalItems(loc);
                    
                    // Robust deduplication and linking for Imported Services
                    const cleanImpSrv: UiItem[] = [];
                    const usedImpSrv = new Set<number>();
                    
                    imp.forEach(parent => {
                        const defaultName = parent.serviceName !== undefined
                            ? parent.serviceName
                            : parent.product ? `${parent.product.name} ${parent.product.itemCode ? `(${parent.product.itemCode})` : ''}` : '';
                        
                        const matchIdx = impSrv.findIndex((s, idx) => !usedImpSrv.has(idx) && s.serviceName === defaultName);
                        if (matchIdx !== -1) {
                            cleanImpSrv.push({ ...impSrv[matchIdx], linkedId: parent.id });
                            usedImpSrv.add(matchIdx);
                        }
                    });
                    
                    impSrv.forEach((s, idx) => {
                        if (!usedImpSrv.has(idx)) {
                            const isDuplicate = imp.some(parent => {
                                const defaultName = parent.serviceName !== undefined ? parent.serviceName : parent.product ? `${parent.product.name} ${parent.product.itemCode ? `(${parent.product.itemCode})` : ''}` : '';
                                return s.serviceName === defaultName;
                            });
                            if (!isDuplicate) cleanImpSrv.push(s);
                        }
                    });
                    
                    // Robust deduplication and linking for Local Services
                    const cleanLocSrv: UiItem[] = [];
                    const usedLocSrv = new Set<number>();
                    
                    loc.forEach(parent => {
                        const defaultName = parent.serviceName !== undefined
                            ? parent.serviceName
                            : parent.product ? `${parent.product.name} ${parent.product.itemCode ? `(${parent.product.itemCode})` : ''}` : '';
                        
                        const matchIdx = locSrv.findIndex((s, idx) => !usedLocSrv.has(idx) && s.serviceName === defaultName);
                        if (matchIdx !== -1) {
                            cleanLocSrv.push({ ...locSrv[matchIdx], linkedId: parent.id });
                            usedLocSrv.add(matchIdx);
                        }
                    });
                    
                    locSrv.forEach((s, idx) => {
                        if (!usedLocSrv.has(idx)) {
                            const isDuplicate = loc.some(parent => {
                                const defaultName = parent.serviceName !== undefined ? parent.serviceName : parent.product ? `${parent.product.name} ${parent.product.itemCode ? `(${parent.product.itemCode})` : ''}` : '';
                                return s.serviceName === defaultName;
                            });
                            if (!isDuplicate) cleanLocSrv.push(s);
                        }
                    });

                    setImportedServiceItems(cleanImpSrv);
                    setLocalServiceItems(cleanLocSrv);

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

    // Recalculate local items when config changes
    useEffect(() => {
        if (localItems.length > 0) {
            setLocalItems(prev => prev.map(item => calculateLocalItem(item, formData)));
        }
    }, [formData.localTransportationPct, formData.localProfitPct]);

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
        setImportedItems(prev => [...prev, makeEmptyRow("Imported")]);
    };
    
    const handleAddLocal = () => {
        setLocalItems(prev => [...prev, makeEmptyRow("Local")]);
    };

    const handleRemoveImported = (idx: number) => {
        setImportedItems(prev => {
            const removed = prev[idx];
            if (removed && showImportedServices) {
                setImportedServiceItems(srv => srv.filter(s => s.linkedId !== removed.id));
            }
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleRemoveLocal = (idx: number) => {
        setLocalItems(prev => {
            const removed = prev[idx];
            if (removed && showLocalServices) {
                setLocalServiceItems(srv => srv.filter(s => s.linkedId !== removed.id));
            }
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleRemoveImportedService = (id: string, linkedId?: string) => {
        setImportedServiceItems(prev => prev.filter(x => x.id !== id));
        if (linkedId) setDeletedImportedServiceIds(prev => new Set(prev).add(linkedId));
    };

    const handleRemoveLocalService = (id: string, linkedId?: string) => {
        setLocalServiceItems(prev => prev.filter(x => x.id !== id));
        if (linkedId) setDeletedLocalServiceIds(prev => new Set(prev).add(linkedId));
    };

    const handleAddImportedService = () => {
        setImportedServiceItems([...importedServiceItems, makeEmptyRow("ImportedService")]);
    };
    
    const handleAddLocalService = () => {
        setLocalServiceItems([...localServiceItems, makeEmptyRow("LocalService")]);
    };

    const handleSupplyNameChange = (list: "imported" | "local", idx: number, newName: string) => {
        if (list === "imported") {
            const newArr = [...importedItems];
            newArr[idx] = { ...newArr[idx], serviceName: newName };
            setImportedItems(newArr);
        } else {
            const newArr = [...localItems];
            newArr[idx] = { ...newArr[idx], serviceName: newName };
            setLocalItems(newArr);
        }
    };

    const handleAddCustomRow = (listType: "Imported" | "Local" | "ImportedService" | "LocalService") => {
        setCustomRowModal({ isOpen: true, listType, rowIndex: "" });
    };

    const confirmAddCustomRow = () => {
        const { listType, rowIndex } = customRowModal;
        if (!listType) return;
        
        let targetIndex = parseInt(rowIndex, 10);
        if (isNaN(targetIndex) || targetIndex < 0) targetIndex = 1;
        
        const emptyRow = makeEmptyRow(listType === "ImportedService" ? "ImportedService" : listType === "LocalService" ? "LocalService" : listType);
        
        if (listType === "Imported") {
            const arr = [...importedItems];
            arr.splice(targetIndex, 0, emptyRow);
            setImportedItems(arr);
        } else if (listType === "Local") {
            const arr = [...localItems];
            arr.splice(targetIndex, 0, emptyRow);
            setLocalItems(arr);
        } else if (listType === "ImportedService") {
            const arr = [...importedServiceItems];
            arr.splice(targetIndex, 0, emptyRow);
            setImportedServiceItems(arr);
        } else if (listType === "LocalService") {
            const arr = [...localServiceItems];
            arr.splice(targetIndex, 0, emptyRow);
            setLocalServiceItems(arr);
        }
        setCustomRowModal({ isOpen: false, listType: null, rowIndex: "" });
    };
    /* ─── Resolve unit for payload ─── */
    const resolveUnit = (item: UiItem) => {
        if (item.unit === "Custom" && item.customUnit) return item.customUnit;
        return item.unit || "";
    };

    /* ─── Enter key moves to next product row ─── */
    const handleProductRowKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
        sectionAttr: string,
        rowIdx: number,
        addRowFn: () => void
    ) => {
        if (e.key !== "Enter") return;

        // Allow Shift+Enter to insert a newline in textarea without moving to next row
        if (e.shiftKey && e.currentTarget.tagName.toLowerCase() === 'textarea') {
            return;
        }

        e.preventDefault();
        // Try to find next row's first input in the same section
        const allInputs = Array.from(
            document.querySelectorAll<HTMLElement>(`[data-section="${sectionAttr}"] input, [data-section="${sectionAttr}"] textarea`)
        );
        const currentIndex = allInputs.indexOf(e.currentTarget as HTMLElement);
        // Find first input of next row (skip current row inputs)
        const nextRowFirstInput = allInputs.find((el, i) => {
            const elRow = Number((el as HTMLElement).dataset?.rowIndex ?? -1);
            const curRow = rowIdx;
            return i > currentIndex && elRow > curRow;
        });
        if (nextRowFirstInput) {
            nextRowFirstInput.focus();
        } else {
            // If no next row, add a new row and focus it after a tick
            addRowFn();
            setTimeout(() => {
                const updated = Array.from(
                    document.querySelectorAll<HTMLElement>(`[data-section="${sectionAttr}"] input, [data-section="${sectionAttr}"] textarea`)
                );
                const lastInput = updated[updated.length - 1];
                if (lastInput) lastInput.focus();
            }, 50);
        }
    };

    const renderTotals = () => {
        let subTotal = 0;
        let suppliesTotal = 0;
        let servicesTotal = 0;

        if (showImported) {
            const sum = importedItems.reduce((acc, i) => acc + i.lineTotal, 0);
            subTotal += sum;
            suppliesTotal += sum;
        }
        if (showLocal) {
            const sum = localItems.reduce((acc, i) => acc + i.lineTotal, 0);
            subTotal += sum;
            suppliesTotal += sum;
        }
        if (showImportedServices) {
            const sum = importedServiceItems.reduce((acc, i) => acc + i.lineTotal, 0);
            subTotal += sum;
            servicesTotal += sum;
        }
        if (showLocalServices) {
            const sum = localServiceItems.reduce((acc, i) => acc + i.lineTotal, 0);
            subTotal += sum;
            servicesTotal += sum;
        }

        const gst = suppliesTotal * (formData.gstPercentage / 100);
        const income = suppliesTotal * (formData.incomeTaxPercentage / 100);
        const provincial = servicesTotal * ((formData.provincialTaxPercentage || 0) / 100);
        const grand = subTotal + gst + income + provincial - formData.adjustment;
        // WHT applies to grand total, shown separately, NOT part of grand total
        const wht = grand * ((whtPercentage || 0) / 100);

        return { subTotal, gst, income, provincial, grand, wht };
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
                 unitQty: i.unitQty || 0,
                 referenceNumber: i.referenceNumber || undefined,
                 remarks: i.remarks || undefined
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
                 overridePrice: i.originalPrice,
                 finalPriceOverride: i.isManualFinalPrice ? i.unitPrice : undefined,
                 unit: resolveUnit(i),
                 unitQty: i.unitQty || 0,
                 referenceNumber: i.referenceNumber || undefined,
                 remarks: i.remarks || undefined
             })));
        }
        if (showImportedServices) {
             const valid = importedServiceItems.filter(i => i.serviceName && i.serviceName.trim() !== "");
             payloadItems.push(...valid.map(i => ({ quantity: i.quantity, itemType: "ImportedService", serviceName: i.serviceName, servicePrice: i.servicePrice, unit: resolveUnit(i), unitQty: i.unitQty || 0, referenceNumber: i.referenceNumber || undefined, remarks: i.remarks || undefined })));
        }
        if (showLocalServices) {
             const valid = localServiceItems.filter(i => i.serviceName && i.serviceName.trim() !== "");
             payloadItems.push(...valid.map(i => ({ quantity: i.quantity, itemType: "LocalService", serviceName: i.serviceName, servicePrice: i.servicePrice, unit: resolveUnit(i), unitQty: i.unitQty || 0, referenceNumber: i.referenceNumber || undefined, remarks: i.remarks || undefined })));
        }

        if (payloadItems.length === 0) {
            toast.error("Please add at least one valid product or service line item."); return;
        }

        const modes = [];
        if (showImported) modes.push("Imported");
        if (showLocal) modes.push("Local");
        if (showImportedServices) modes.push("Imported Services");
        if (showLocalServices) modes.push("Local Services");
        
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

            if (isEditMode) {
                await quotationService.updateQuotation(Number(id), payload);
                toast.success("Quotation updated successfully");
            } else if (isReviseMode) {
                await quotationService.createQuotation(payload);
                toast.success("Quotation revised successfully");
            } else {
                await quotationService.createQuotation(payload);
                toast.success("Quotation created successfully");
            }
            setIsSubmitted(true);
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
    const renderServiceNameDisplay = (item: UiItem, idx: number, list: "imported" | "local" | "service" | "importedService" | "localService") => {
        const isEditing = editingServiceName?.list === list && editingServiceName?.index === idx;
        const setItems = list === "imported" ? setImportedItems : list === "local" ? setLocalItems : list === "importedService" ? setImportedServiceItems : setLocalServiceItems;
        const items = list === "imported" ? importedItems : list === "local" ? localItems : list === "importedService" ? importedServiceItems : localServiceItems;
        
        const displayName = item.serviceName || (item.product?.name ? item.product.name : "");
        
        if (isEditing) {
            return (
                <AutoResizeTextarea 
                    rows={2}
                    className={inputCls + " resize-y"}
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
                <span className="text-foreground font-medium whitespace-pre-wrap">{displayName || "Tap to enter service name..."}</span>
                <button type="button" className="p-1 shrink-0 text-muted-foreground hover:text-primary transition-colors" title="Edit Service Name">
                    <Pencil className="h-4 w-4" />
                </button>
            </div>
        );
    };

    const calculateLocalItem = (item: UiItem, config: Omit<CreateQuotationDto, 'items'>, forcedBasePrice?: number): UiItem => {
        if (item.isManualFinalPrice) {
            return {
                ...item,
                unitPrice: item.finalPriceOverride || 0,
                lineTotal: (item.finalPriceOverride || 0) * item.quantity,
                originalPrice: forcedBasePrice ?? item.originalPrice ?? (item.product?.price ?? 0)
            };
        }

        const basePrice = forcedBasePrice ?? item.originalPrice ?? (item.product?.price ?? 0);
        if (!basePrice || basePrice === 0) return item;

        const transCharge = basePrice * (config.localTransportationPct! / 100);
        const profCharge = basePrice * (config.localProfitPct! / 100);
        const finalPrice = basePrice + transCharge + profCharge;

        return {
            ...item,
            originalPrice: basePrice,
            unitPrice: finalPrice,
            lineTotal: finalPrice * item.quantity,
            calcBreakdown: JSON.stringify({
                originalPrice: basePrice,
                transportationPct: config.localTransportationPct,
                transportationCharge: transCharge,
                profitPct: config.localProfitPct,
                profitCharge: profCharge,
                finalPrice: finalPrice
            })
        };
    };

    /* ─── Mobile card renderer for items ─── */
    const renderImportedCard = (item: UiItem, idx: number) => (
        <div key={item.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center w-full gap-1.5">
                <AutoResizeTextarea 
                    rows={2}
                    className={inputCls + " flex-1 min-w-0 resize-y"} 
                    placeholder="Custom product name..."
                    value={item.serviceName !== undefined ? item.serviceName : (item.product ? `${item.product.name} ${item.product.itemCode ? `(${item.product.itemCode})` : ""}` : "")}
                    onChange={e => handleSupplyNameChange("imported", idx, e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => handleOpenProductModal({ list: "imported", index: idx })}
                    className="p-2 bg-secondary border border-border rounded-md hover:bg-secondary/80 shrink-0 flex items-center justify-center"
                    title="Browse Catalog"
                >
                    <Search className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Ref # (Optional)</label>
                    <input type="text" placeholder="e.g. ITEM-01" className={inputCls + " !py-1 !text-xs mt-1"} value={item.referenceNumber || ""} onChange={e => {
                        const newArr = [...importedItems];
                        newArr[idx] = { ...newArr[idx], referenceNumber: e.target.value };
                        setImportedItems(newArr);
                    }}/>
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Remarks</label>
                    <AutoResizeTextarea rows={2} placeholder="Remarks..." className={inputCls + " !py-1 !text-xs mt-1"} value={item.remarks || ""} onChange={e => {
                        const newArr = [...importedItems];
                        newArr[idx] = { ...newArr[idx], remarks: e.target.value };
                        setImportedItems(newArr);
                    }}/>
                </div>
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
                    <button type="button" onClick={() => handleRemoveImported(idx)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive"/>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderLocalCard = (item: UiItem, idx: number) => (
        <div key={item.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center w-full gap-1.5">
                <AutoResizeTextarea 
                    rows={2}
                    className={inputCls + " flex-1 min-w-0 resize-y"} 
                    placeholder="Custom product name..."
                    value={item.serviceName !== undefined ? item.serviceName : (item.product ? `${item.product.name} ${item.product.itemCode ? `(${item.product.itemCode})` : ""}` : "")}
                    onChange={e => handleSupplyNameChange("local", idx, e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => handleOpenProductModal({ list: "local", index: idx })}
                    className="p-2 bg-secondary border border-border rounded-md hover:bg-secondary/80 shrink-0 flex items-center justify-center"
                    title="Browse Catalog"
                >
                    <Search className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Ref # (Optional)</label>
                    <input type="text" placeholder="e.g. ITEM-01" className={inputCls + " !py-1 !text-xs mt-1"} value={item.referenceNumber || ""} onChange={e => {
                        const newArr = [...localItems];
                        newArr[idx] = { ...newArr[idx], referenceNumber: e.target.value };
                        setLocalItems(newArr);
                    }}/>
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Remarks</label>
                    <AutoResizeTextarea rows={2} placeholder="Remarks..." className={inputCls + " !py-1 !text-xs mt-1"} value={item.remarks || ""} onChange={e => {
                        const newArr = [...localItems];
                        newArr[idx] = { ...newArr[idx], remarks: e.target.value };
                        setLocalItems(newArr);
                    }}/>
                </div>
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
                        newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value) };
                        setLocalItems(newArr.map(x => calculateLocalItem(x, formData)));
                    }}/>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-muted-foreground">Base Price (PKR)</label>
                    <input type="number" step="any" className={inputCls + " !py-1.5"} min="0" value={item.originalPrice||0} onChange={e => {
                        const newArr = [...localItems];
                        newArr[idx] = { ...newArr[idx], originalPrice: Number(e.target.value) };
                        setLocalItems(newArr.map(x => calculateLocalItem(x, formData)));
                    }}/>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-muted-foreground">Final Unit</label>
                        {item.calcBreakdown && (
                            <button type="button" onClick={() => setModalBreakdown(JSON.parse(item.calcBreakdown!))} className="text-emerald-500 hover:text-emerald-600 transition-colors">
                                <Calculator className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="text-sm font-medium py-1">{item.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
                <button type="button" onClick={() => handleRemoveLocal(idx)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4 text-destructive"/>
                </button>
            </div>
        </div>
    );

    return (
        <>
        <FormPrompt isDirty={!isSubmitted && !saving && (importedItems.length > 0 || localItems.length > 0 || importedServiceItems.length > 0 || localServiceItems.length > 0 || formData.customerId > 0)} />
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
                         { label: "Imported Items Supply", checked: showImported, onChange: setShowImported, color: "blue" },
                         { label: "Local Items Supply", checked: showLocal, onChange: setShowLocal, color: "emerald" },
                         { label: "Imported Items Services", checked: showImportedServices, onChange: setShowImportedServices, color: "purple" },
                           { label: "Local Items Services", checked: showLocalServices, onChange: setShowLocalServices, color: "orange" },
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
                            <option value="ImportedOnly">Imported Items Supply &amp; Services Only</option>
                            <option value="LocalOnly">Local Items Supply &amp; Services Only</option>
                         </select>
                     </div>
                     <div>
                         <label className="text-xs font-semibold text-primary block mb-1.5">Exchange Rate (USD → PKR)</label>
                         <input type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})} className={inputCls + " !border-primary/40 focus:!ring-primary/30"} />
                     </div>
                </div>

                {/* ── PROJECT CODE & HEADLINE ── */}
                <div className="bg-secondary/30 border border-border/50 rounded-2xl p-4 md:p-6 shadow-md grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Project Code (Quote Suffix)</label>
                        <input type="text" placeholder="FPS" value={formData.projectCode || ""} onChange={e => setFormData({...formData, projectCode: e.target.value.toUpperCase()})} className={inputCls} />
                        <p className="text-xs text-muted-foreground mt-1">Quote # will be: MTQ-AA#####-{formData.projectCode || "FPS"}-R0</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">PDF Headline (auto-generated if blank)</label>
                        <input type="text" placeholder="e.g. Fire Fighting Equipments for Marka-e-Haq Monument" value={formData.quoteHeadline || ""} onChange={e => setFormData({...formData, quoteHeadline: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">BOQ Reference Number (Optional)</label>
                        <input type="text" placeholder="e.g. BOQ-2026-001" value={formData.boqReferenceNumber || ""} onChange={e => setFormData({...formData, boqReferenceNumber: e.target.value})} className={inputCls} />
                    </div>
                </div>

                {/* ── IMPORTED SECTION ── */}
                {showImported && (
                     <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-xl animate-in slide-in-from-bottom-4 relative">
                         <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl" />
                         <div className="flex justify-between items-center mb-4 pl-3">
                             <h3 className="text-base md:text-lg font-bold text-blue-500 dark:text-blue-400 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                 Imported Items Supply
                             </h3>
                             <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleAddCustomRow("Imported")} className="text-sm bg-blue-500/10 text-blue-500 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-blue-500/20 transition-colors">
                                    <Plus className="w-4 h-4 mr-1"/> Add Custom Row
                                </button>
                                <button type="button" onClick={handleAddImported} className="text-sm bg-blue-500/10 text-blue-500 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-blue-500/20 transition-colors">
                                    <Plus className="w-4 h-4 mr-1"/> Add Row
                                </button>
                            </div>
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
                         <table className="w-full text-sm min-w-[800px]">
                             <thead className="text-xs text-muted-foreground uppercase"><tr className="border-b border-border/60"><th className="text-left py-2 pr-2 min-w-[200px] w-auto">Product</th><th className="w-[80px] text-center">Ref #</th><th className="text-left py-2 px-1 min-w-[150px] w-auto">Remarks</th><th className="w-[100px] text-center">Unit</th><th className="w-16 text-center">Qty</th><th className="w-24 text-right">Base (USD)</th><th className="w-32 text-right">Final (PKR)</th><th className="w-28 text-right">Total</th><th className="w-10"></th></tr></thead>
                             <tbody data-section="imported">
                                 {importedItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/30">
                                         <td className="py-2 pr-2">
                                              <div className="flex items-center w-full gap-1.5">
                                                  <AutoResizeTextarea 
                                                      rows={2}
                                                      data-row-index={idx}
                                                      className={inputCls + " !py-1.5 flex-1 min-w-0 text-sm resize-y"} 
                                                      placeholder="Custom product name..."
                                                      value={item.serviceName !== undefined ? item.serviceName : (item.product ? `${item.product.name} ${item.product.itemCode ? `(${item.product.itemCode})` : ""}` : "")}
                                                      onChange={e => handleSupplyNameChange("imported", idx, e.target.value)}
                                                      onKeyDown={e => handleProductRowKeyDown(e, "imported", idx, handleAddImported)}
                                                  />
                                                  <button
                                                      type="button"
                                                      onClick={() => handleOpenProductModal({ list: "imported", index: idx })}
                                                      className="p-1.5 bg-secondary border border-border rounded-md hover:bg-secondary/80 shrink-0 flex items-center justify-center"
                                                      title="Browse Catalog"
                                                  >
                                                      <Search className="h-4 w-4 text-muted-foreground" />
                                                  </button>
                                              </div>
                                         </td>
                                         <td className="px-1">
                                             <input type="text" placeholder="Ref #" className={inputCls + " !py-1 !text-xs text-center"} value={item.referenceNumber || ""} onChange={e => {
                                                 const newArr = [...importedItems];
                                                 newArr[idx] = { ...newArr[idx], referenceNumber: e.target.value };
                                                 setImportedItems(newArr);
                                             }}/>
                                         </td>
                                         <td className="px-1">
                                             <AutoResizeTextarea
                                                 rows={2}
                                                 placeholder="Remarks..."
                                                 className={inputCls + " !py-1.5 w-full min-w-0 text-sm resize-y"}
                                                 value={item.remarks || ""}
                                                 onChange={e => {
                                                     const newArr = [...importedItems];
                                                     newArr[idx] = { ...newArr[idx], remarks: e.target.value };
                                                     setImportedItems(newArr);
                                                 }}
                                             />
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
                                             <button type="button" onClick={() => handleRemoveImported(idx)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
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
                                 Local Items Supply
                             </h3>
                             <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleAddCustomRow("Local")} className="text-sm bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-emerald-500/20 transition-colors">
                                    <Plus className="w-4 h-4 mr-1"/> Add Custom Row
                                </button>
                                <button type="button" onClick={handleAddLocal} className="text-sm bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-emerald-500/20 transition-colors">
                                    <Plus className="w-4 h-4 mr-1"/> Add Row
                                </button>
                            </div>
                         </div>
                         {/* Config bar for Local */}
                         <div className="flex gap-3 md:gap-4 mb-4 text-xs bg-primary/5 border border-border p-3 rounded-xl ml-3 flex-wrap">
                             <div className="flex items-center gap-1 text-muted-foreground">Transport %: <input type="number" step="any" className={tinyInputCls} value={formData.localTransportationPct} onChange={e=>setFormData({...formData, localTransportationPct: Number(e.target.value)})} /></div>
                             <div className="flex items-center gap-1 text-muted-foreground">Profit %: <input type="number" step="any" className={tinyInputCls} value={formData.localProfitPct} onChange={e=>setFormData({...formData, localProfitPct: Number(e.target.value)})} /></div>
                         </div>
                         {/* Desktop table */}
                         <div className="hidden md:block overflow-x-auto ml-3">
                         <table className="w-full text-sm min-w-[800px]">
                             <thead className="text-xs text-muted-foreground uppercase"><tr className="border-b border-border/60"><th className="text-left py-2 pr-2 min-w-[200px] w-auto">Product</th><th className="w-[80px] text-center">Ref #</th><th className="text-left py-2 px-1 min-w-[150px] w-auto">Remarks</th><th className="w-[100px] text-center">Unit</th><th className="w-16 text-center">Qty</th><th className="w-24 text-right">Base (PKR)</th><th className="w-32 text-right">Final (PKR)</th><th className="w-28 text-right">Total</th><th className="w-10"></th></tr></thead>
                             <tbody data-section="local">
                                 {localItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/30">
                                         <td className="py-2 pr-2">
                                              <div className="flex items-center w-full gap-1.5">
                                                  <AutoResizeTextarea 
                                                      rows={2}
                                                       data-row-index={idx}
                                                      className={inputCls + " !py-1.5 flex-1 min-w-0 text-sm resize-y"} 
                                                      placeholder="Custom product name..."
                                                      value={item.serviceName !== undefined ? item.serviceName : (item.product ? `${item.product.name} ${item.product.itemCode ? `(${item.product.itemCode})` : ""}` : "")}
                                                      onChange={e => handleSupplyNameChange("local", idx, e.target.value)}
                                                       onKeyDown={e => handleProductRowKeyDown(e, "local", idx, handleAddLocal)}
                                                  />
                                                  <button
                                                      type="button"
                                                      onClick={() => handleOpenProductModal({ list: "local", index: idx })}
                                                      className="p-1.5 bg-secondary border border-border rounded-md hover:bg-secondary/80 shrink-0 flex items-center justify-center"
                                                      title="Browse Catalog"
                                                  >
                                                      <Search className="h-4 w-4 text-muted-foreground" />
                                                  </button>
                                              </div>
                                         </td>
                                         <td className="px-1">
                                             <input type="text" placeholder="Ref #" className={inputCls + " !py-1 !text-xs text-center"} value={item.referenceNumber || ""} onChange={e => {
                                                 const newArr = [...localItems];
                                                 newArr[idx] = { ...newArr[idx], referenceNumber: e.target.value };
                                                 setLocalItems(newArr);
                                             }}/>
                                         </td>
                                         <td className="px-1">
                                             <AutoResizeTextarea
                                                 rows={2}
                                                 placeholder="Remarks..."
                                                 className={inputCls + " !py-1.5 w-full min-w-0 text-sm resize-y"}
                                                 value={item.remarks || ""}
                                                 onChange={e => {
                                                     const newArr = [...localItems];
                                                     newArr[idx] = { ...newArr[idx], remarks: e.target.value };
                                                     setLocalItems(newArr);
                                                 }}
                                             />
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
                                                  newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value) };
                                                  setLocalItems(newArr.map(x => calculateLocalItem(x, formData)));
                                              }}/>
                                         </td>
                                         <td className="px-1 relative">
                                              {item.calcBreakdown && (
                                                  <button
                                                      type="button"
                                                      onClick={() => setModalBreakdown(JSON.parse(item.calcBreakdown!))}
                                                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded z-10"
                                                  >
                                                      <Calculator className="w-4 h-4" />
                                                  </button>
                                              )}
                                              <input type="number" step="any" className={inputCls + " !px-2 !py-1.5 text-right pl-8"} min="0" value={item.originalPrice||0} onChange={e => {
                                                  const newArr = [...localItems];
                                                  newArr[idx] = { ...newArr[idx], originalPrice: Number(e.target.value) };
                                                  setLocalItems(newArr.map(x => calculateLocalItem(x, formData)));
                                              }}/>
                                         </td>
                                         <td className="text-right font-medium text-foreground">
                                             {item.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                         </td>
                                         <td className="text-right font-bold text-foreground">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                         <td className="text-center">
                                             <button type="button" onClick={() => handleRemoveLocal(idx)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
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

                {/* ── IMPORTED SERVICES SECTION ── */}
                {showImportedServices && (
                     <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-xl animate-in slide-in-from-bottom-4 relative">
                         <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl" />
                         <div className="flex justify-between items-center mb-4 pl-3">
                             <h3 className="text-base md:text-lg font-bold text-purple-500 dark:text-purple-400 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                 Imported Items Services
                             </h3>
                             <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleAddCustomRow("ImportedService")} className="text-sm bg-purple-500/10 text-purple-500 dark:text-purple-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-purple-500/20 transition-colors">
                                    <Plus className="w-4 h-4 mr-1"/> Add Custom Row
                                </button>
                                <button type="button" onClick={handleAddImportedService} className="text-sm bg-purple-500/10 text-purple-500 dark:text-purple-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-purple-500/20 transition-colors">
                                    <Plus className="w-4 h-4 mr-1"/> Add Row
                                </button>
                            </div>
                         </div>
                         {/* Desktop table */}
                         <div className="hidden md:block overflow-x-auto ml-3">
                         <table className="w-full text-sm min-w-[800px]">
                             <thead className="text-xs text-muted-foreground uppercase"><tr className="border-b border-border/60"><th className="text-left py-2 pr-2 min-w-[200px] w-auto">Service Name</th><th className="w-[80px] text-center">Ref #</th><th className="text-left py-2 px-1 min-w-[150px] w-auto">Remarks</th><th className="w-16 text-center">Qty</th><th className="w-28 text-right">Price (PKR)</th><th className="w-28 text-right">Total</th><th className="w-10"></th></tr></thead>
                             <tbody>
                                 {importedServiceItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/30">
                                         <td className="py-2 pr-2">
                                              {renderServiceNameDisplay(item, idx, "importedService")}
                                         </td>
                                         <td className="px-1">
                                             <input type="text" placeholder="Ref #" className={inputCls + " !py-1.5 !text-xs text-center"} value={item.referenceNumber || ""} onChange={e => {
                                                 const newArr = [...importedServiceItems];
                                                 newArr[idx] = { ...newArr[idx], referenceNumber: e.target.value };
                                                 setImportedServiceItems(newArr);
                                             }}/>
                                         </td>
                                         <td className="px-1">
                                             <AutoResizeTextarea
                                                 rows={2}
                                                 placeholder="Remarks..."
                                                 className={inputCls + " !py-1.5 w-full min-w-0 text-sm resize-y"}
                                                 value={item.remarks || ""}
                                                 onChange={e => {
                                                     const newArr = [...importedServiceItems];
                                                     newArr[idx] = { ...newArr[idx], remarks: e.target.value };
                                                     setImportedServiceItems(newArr);
                                                 }}
                                             />
                                         </td>
                                         <td className="px-1">
                                              <input type="number" className={inputCls + " !px-2 !py-1.5 text-center"} min="1" value={item.quantity} onChange={e => {
                                                  const newArr = [...importedServiceItems];
                                                  newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * (newArr[idx].servicePrice||0) };
                                                  setImportedServiceItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="pl-1">
                                              <input type="number" step="any" className={inputCls + " !px-2 !py-1.5 text-right"} min="0" value={item.servicePrice||0} onChange={e => {
                                                  const newArr = [...importedServiceItems];
                                                  newArr[idx] = { ...newArr[idx], servicePrice: Number(e.target.value), unitPrice: Number(e.target.value), lineTotal: newArr[idx].quantity * Number(e.target.value) };
                                                  setImportedServiceItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="text-right font-bold text-foreground">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                         <td className="text-center">
                                             <button type="button" onClick={() => handleRemoveImportedService(item.id, item.linkedId)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
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
                             {importedServiceItems.map((item, idx) => (
                                 <div key={item.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
                                     {renderServiceNameDisplay(item, idx, "importedService")}
                                     <div className="grid grid-cols-2 gap-3 mb-3">
                                         <div className="col-span-2">
                                             <label className="text-xs text-muted-foreground">Ref # (Optional)</label>
                                             <input type="text" placeholder="e.g. ITEM-01" className={inputCls + " !py-1 !text-xs mt-1"} value={item.referenceNumber || ""} onChange={e => {
                                                 const newArr = [...importedServiceItems];
                                                 newArr[idx] = { ...newArr[idx], referenceNumber: e.target.value };
                                                 setImportedServiceItems(newArr);
                                             }}/>
                                         </div>
                                         <div className="col-span-2">
                                             <label className="text-xs text-muted-foreground">Remarks</label>
                                             <AutoResizeTextarea rows={2} placeholder="Remarks..." className={inputCls + " !py-1 !text-xs mt-1"} value={item.remarks || ""} onChange={e => {
                                                 const newArr = [...importedServiceItems];
                                                 newArr[idx] = { ...newArr[idx], remarks: e.target.value };
                                                 setImportedServiceItems(newArr);
                                             }}/>
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-2 gap-3">
                                         <div><label className="text-xs text-muted-foreground">Qty</label><input type="number" className={inputCls + " !py-1.5"} min="1" value={item.quantity} onChange={e => { const newArr = [...importedServiceItems]; newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * (newArr[idx].servicePrice||0) }; setImportedServiceItems(newArr); }}/></div>
                                         <div><label className="text-xs text-muted-foreground">Price</label><input type="number" step="any" className={inputCls + " !py-1.5"} min="0" value={item.servicePrice||0} onChange={e => { const newArr = [...importedServiceItems]; newArr[idx] = { ...newArr[idx], servicePrice: Number(e.target.value), unitPrice: Number(e.target.value), lineTotal: newArr[idx].quantity * Number(e.target.value) }; setImportedServiceItems(newArr); }}/></div>
                                     </div>
                                     <div className="flex items-center justify-between">
                                         <span className="text-sm font-bold text-primary">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
                                         <button type="button" onClick={() => handleRemoveImportedService(item.id, item.linkedId)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive"/></button>
                                     </div>
                                 </div>
                             ))}
                         </div>

                         {importedServiceItems.length > 0 && (
                             <div className="mt-3 ml-3 text-right text-sm font-bold text-foreground border-t border-border/40 pt-3 pr-4 md:pr-14">
                                 Section Total: {importedServiceItems.reduce((s, i) => s + i.lineTotal, 0).toLocaleString(undefined, {maximumFractionDigits:2})} PKR
                             </div>
                         )}
                     </div>
                )}

                
                {/* ── LOCAL SERVICES SECTION ── */}
                {showLocalServices && (
                     <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-xl animate-in slide-in-from-bottom-4 relative">
                         <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-2xl" />
                         <div className="flex justify-between items-center mb-4 pl-3">
                             <h3 className="text-base md:text-lg font-bold text-orange-500 dark:text-orange-400 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                 Local Items Services
                             </h3>
                             <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleAddCustomRow("LocalService")} className="text-sm bg-orange-500/10 text-orange-500 dark:text-orange-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-orange-500/20 transition-colors">
                                    <Plus className="w-4 h-4 mr-1"/> Add Custom Row
                                </button>
                                <button type="button" onClick={handleAddLocalService} className="text-sm bg-orange-500/10 text-orange-500 dark:text-orange-400 px-3 py-1.5 rounded-lg flex items-center hover:bg-orange-500/20 transition-colors">
                                    <Plus className="w-4 h-4 mr-1"/> Add Row
                                </button>
                            </div>
                         </div>
                         {/* Desktop table */}
                         <div className="hidden md:block overflow-x-auto ml-3">
                         <table className="w-full text-sm min-w-[800px]">
                             <thead className="text-xs text-muted-foreground uppercase"><tr className="border-b border-border/60"><th className="text-left py-2 pr-2 min-w-[200px] w-auto">Service Name</th><th className="w-[80px] text-center">Ref #</th><th className="text-left py-2 px-1 min-w-[150px] w-auto">Remarks</th><th className="w-16 text-center">Qty</th><th className="w-28 text-right">Price (PKR)</th><th className="w-28 text-right">Total</th><th className="w-10"></th></tr></thead>
                             <tbody>
                                 {localServiceItems.map((item, idx) => (
                                     <tr key={item.id} className="border-t border-border/30">
                                         <td className="py-2 pr-2">
                                              {renderServiceNameDisplay(item, idx, "localService")}
                                         </td>
                                         <td className="px-1">
                                             <input type="text" placeholder="Ref #" className={inputCls + " !py-1.5 !text-xs text-center"} value={item.referenceNumber || ""} onChange={e => {
                                                 const newArr = [...localServiceItems];
                                                 newArr[idx] = { ...newArr[idx], referenceNumber: e.target.value };
                                                 setLocalServiceItems(newArr);
                                             }}/>
                                         </td>
                                         <td className="px-1">
                                             <AutoResizeTextarea
                                                 rows={2}
                                                 placeholder="Remarks..."
                                                 className={inputCls + " !py-1.5 w-full min-w-0 text-sm resize-y"}
                                                 value={item.remarks || ""}
                                                 onChange={e => {
                                                     const newArr = [...localServiceItems];
                                                     newArr[idx] = { ...newArr[idx], remarks: e.target.value };
                                                     setLocalServiceItems(newArr);
                                                 }}
                                             />
                                         </td>
                                         <td className="px-1">
                                              <input type="number" className={inputCls + " !px-2 !py-1.5 text-center"} min="1" value={item.quantity} onChange={e => {
                                                  const newArr = [...localServiceItems];
                                                  newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * (newArr[idx].servicePrice||0) };
                                                  setLocalServiceItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="pl-1">
                                              <input type="number" step="any" className={inputCls + " !px-2 !py-1.5 text-right"} min="0" value={item.servicePrice||0} onChange={e => {
                                                  const newArr = [...localServiceItems];
                                                  newArr[idx] = { ...newArr[idx], servicePrice: Number(e.target.value), unitPrice: Number(e.target.value), lineTotal: newArr[idx].quantity * Number(e.target.value) };
                                                  setLocalServiceItems(newArr);
                                              }}/>
                                         </td>
                                         <td className="text-right font-bold text-foreground">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                                         <td className="text-center">
                                             <button type="button" onClick={() => handleRemoveLocalService(item.id, item.linkedId)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
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
                             {localServiceItems.map((item, idx) => (
                                 <div key={item.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
                                     {renderServiceNameDisplay(item, idx, "localService")}
                                     <div className="grid grid-cols-2 gap-3 mb-3">
                                         <div className="col-span-2">
                                             <label className="text-xs text-muted-foreground">Ref # (Optional)</label>
                                             <input type="text" placeholder="e.g. ITEM-01" className={inputCls + " !py-1 !text-xs mt-1"} value={item.referenceNumber || ""} onChange={e => {
                                                 const newArr = [...localServiceItems];
                                                 newArr[idx] = { ...newArr[idx], referenceNumber: e.target.value };
                                                 setLocalServiceItems(newArr);
                                             }}/>
                                         </div>
                                         <div className="col-span-2">
                                             <label className="text-xs text-muted-foreground">Remarks</label>
                                             <AutoResizeTextarea rows={2} placeholder="Remarks..." className={inputCls + " !py-1 !text-xs mt-1"} value={item.remarks || ""} onChange={e => {
                                                 const newArr = [...localServiceItems];
                                                 newArr[idx] = { ...newArr[idx], remarks: e.target.value };
                                                 setLocalServiceItems(newArr);
                                             }}/>
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-2 gap-3">
                                         <div><label className="text-xs text-muted-foreground">Qty</label><input type="number" className={inputCls + " !py-1.5"} min="1" value={item.quantity} onChange={e => { const newArr = [...localServiceItems]; newArr[idx] = { ...newArr[idx], quantity: Number(e.target.value), lineTotal: Number(e.target.value) * (newArr[idx].servicePrice||0) }; setLocalServiceItems(newArr); }}/></div>
                                         <div><label className="text-xs text-muted-foreground">Price</label><input type="number" step="any" className={inputCls + " !py-1.5"} min="0" value={item.servicePrice||0} onChange={e => { const newArr = [...localServiceItems]; newArr[idx] = { ...newArr[idx], servicePrice: Number(e.target.value), unitPrice: Number(e.target.value), lineTotal: newArr[idx].quantity * Number(e.target.value) }; setLocalServiceItems(newArr); }}/></div>
                                     </div>
                                     <div className="flex items-center justify-between">
                                         <span className="text-sm font-bold text-primary">{item.lineTotal > 0 ? item.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
                                         <button type="button" onClick={() => handleRemoveLocalService(item.id, item.linkedId)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive"/></button>
                                     </div>
                                 </div>
                             ))}
                         </div>

                         {localServiceItems.length > 0 && (
                             <div className="mt-3 ml-3 text-right text-sm font-bold text-foreground border-t border-border/40 pt-3 pr-4 md:pr-14">
                                 Section Total: {localServiceItems.reduce((s, i) => s + i.lineTotal, 0).toLocaleString(undefined, {maximumFractionDigits:2})} PKR
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
                                 <label className="text-xs font-semibold text-muted-foreground block mb-1">Provincial Tax</label>
                                 <select className={inputCls} value={formData.provincialTaxType} onChange={e => {
                                     const val = e.target.value;
                                     let pct = formData.provincialTaxPercentage;
                                     if (val === "Punjab") pct = 16;
                                     else if (val === "KPK") pct = 15;
                                     else if (val === "Sindh") pct = 13;
                                     else if (val === "Balochistan") pct = 15;
                                     else if (val === "ICT") pct = 16;
                                     else if (val === "") pct = 0;
                                     setFormData({...formData, provincialTaxType: val, provincialTaxPercentage: pct});
                                 }}>
                                     <option value="">None</option>
                                     <option value="Punjab">Punjab (PRA)</option>
                                     <option value="KPK">KPK (KPRA)</option>
                                     <option value="Sindh">Sindh (SRB)</option>
                                     <option value="Balochistan">Balochistan (BRA)</option>
                                     <option value="ICT">ICT</option>
                                     <option value="Custom">Custom</option>
                                 </select>
                                 {formData.provincialTaxType !== "" && (
                                     <div className="mt-2 flex items-center gap-2">
                                         <span className="text-xs text-muted-foreground whitespace-nowrap">Tax %</span>
                                         <input type="number" step="any" className={inputCls} placeholder="%" value={formData.provincialTaxPercentage} onChange={e => setFormData({...formData, provincialTaxPercentage: Number(e.target.value)})}/>
                                     </div>
                                 )}
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-muted-foreground block mb-1">Global Discount (−)</label>
                                 <input type="number" step="any" className={inputCls + " !text-destructive"} value={formData.adjustment} onChange={e => setFormData({...formData, adjustment: Number(e.target.value)})}/>
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                     WHT (%)
                                     <span className="ml-1 text-[10px] font-normal text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">UI only · not in PDF</span>
                                 </label>
                                 <input
                                     type="number" step="any" min="0" max="100"
                                     className={inputCls + " !text-amber-500"}
                                     value={whtPercentage}
                                     onChange={e => setWhtPercentage(Number(e.target.value))}
                                 />
                             </div>
                         </div>
                     </div>
                     <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/50 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col justify-center">
                         <div className="space-y-3">
                             <div className="flex justify-between text-muted-foreground"><span>Sub Total</span><span className="text-foreground font-medium">{totals.subTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                             {formData.gstPercentage > 0 && <div className="flex justify-between text-muted-foreground"><span>GST ({formData.gstPercentage}%)</span><span className="text-foreground">+ {totals.gst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             {formData.incomeTaxPercentage > 0 && <div className="flex justify-between text-muted-foreground"><span>Income Tax ({formData.incomeTaxPercentage}%)</span><span className="text-foreground">+ {totals.income.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             {(formData.provincialTaxPercentage || 0) > 0 && <div className="flex justify-between text-muted-foreground"><span>{formData.provincialTaxType || "Provincial Tax"} ({(formData.provincialTaxPercentage || 0)}%)</span><span className="text-foreground">+ {totals.provincial.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             {formData.adjustment > 0 && <div className="flex justify-between text-destructive"><span>Global Discount</span><span>- {formData.adjustment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>}
                             
                             <div className={`border-t border-border pt-3 flex justify-between items-end ${whtPercentage > 0 ? '' : ''}`}>
                                 <span className="text-base md:text-lg font-bold text-foreground">
                                     {whtPercentage > 0 ? 'Sub Total (before WHT)' : 'Grand Total'}
                                 </span>
                                 <span className="text-xl md:text-2xl font-black text-primary">
                                     {totals.grand.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm font-medium text-muted-foreground">PKR</span>
                                 </span>
                             </div>

                             {whtPercentage > 0 && (
                                 <>
                                     {/* WHT line */}
                                     <div className="flex justify-between items-center text-amber-500 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                                         <div>
                                             <span className="text-sm font-semibold">WHT ({whtPercentage}%)</span>
                                             <p className="text-[10px] text-muted-foreground">Withholding Tax · UI only · not in PDF</p>
                                         </div>
                                         <span className="text-base font-bold">+ {totals.wht.toLocaleString(undefined, { maximumFractionDigits: 2 })} PKR</span>
                                     </div>

                                     {/* Final Payable */}
                                     <div className="border-t-2 border-primary/40 pt-3 flex justify-between items-end bg-primary/5 rounded-lg px-3 py-2">
                                         <span className="text-base md:text-lg font-extrabold text-foreground">Sub Total (after WHT)</span>
                                         <span className="text-xl md:text-2xl font-black text-primary">
                                             {(totals.grand + totals.wht).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm font-medium text-muted-foreground">PKR</span>
                                         </span>
                                     </div>
                                 </>
                             )}
                         </div>
                        </div>
                    </div>

                    {/* Terms and Conditions Section */}
                        <TermsAndConditionsSection
                            valueJson={formData.termsAndConditionsJson}
                            onChangeJson={(json) => setFormData({ ...formData, termsAndConditionsJson: json })}
                        />

                        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
                             <button type="button" onClick={() => navigate('/quotations')} className="px-6 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
                             <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg hover:-translate-y-0.5 transition-all font-bold flex items-center justify-center gap-2 hover:shadow-primary/25">
                                 {saving && <Loader2 className="w-4 h-4 animate-spin"/>} {isEditMode ? "Update" : isReviseMode ? "Revise" : "Save Quotation"}
                             </button>
                         </div>
            </form>

            {/* ── BREAKDOWN MODAL ── */}
            {modalBreakdown && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setModalBreakdown(null)}>
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

            {/* Custom Row Modal */}
            {customRowModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-background border border-border rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
                            <h3 className="font-semibold text-foreground">Insert Custom Row</h3>
                            <button onClick={() => setCustomRowModal({ isOpen: false, listType: null, rowIndex: "" })} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <label className="text-sm text-foreground">After which row number would you like to insert the new row? (e.g. 1)</label>
                            <input 
                                type="number" 
                                min="0"
                                autoFocus
                                className={inputCls} 
                                value={customRowModal.rowIndex} 
                                onChange={e => setCustomRowModal({ ...customRowModal, rowIndex: e.target.value })}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') confirmAddCustomRow();
                                }}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setCustomRowModal({ isOpen: false, listType: null, rowIndex: "" })} className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="button" onClick={confirmAddCustomRow} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors">
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ProductSelectionModal
                isOpen={productModalTarget !== null}
                onClose={() => setProductModalTarget(null)}
                onSelect={(p) => {
                    if (productModalTarget?.list === "imported") {
                        const newArr = [...importedItems];
                        // Use product.price as the USD base price (shown as "$" in the product catalog/selection modal)
                        const listBasePrice = p.price ?? 0;
                        // Build a CLEAN item: explicitly wipe stale originalPrice & calcBreakdown
                        // so that switching products on the same row always recalculates fresh
                        const brandSuffix = p.brand ? ` Brand: ${p.brand} (by MY TECH)` : '';
                        const cleanItem = {
                            ...newArr[productModalTarget.index],
                            originalPrice: undefined,   // clear stale price
                            calcBreakdown: undefined,   // clear stale breakdown
                            unitPrice: 0,
                            lineTotal: 0,
                            productId: p.id,
                            product: p,
                            serviceName: p.name + brandSuffix,
                        };
                        // Run the full calculation pipeline with the product's USD list price forced
                        newArr[productModalTarget.index] = calculateImportedItem(cleanItem, formData, listBasePrice);
                        setImportedItems(newArr);
                        
                        setShowImportedServices(true);
                        // Service syncing is now handled by the linkedId useEffect
                    } else if (productModalTarget?.list === "local") {
                        const newArr = [...localItems];
                        const listBasePrice = p.price ?? 0;
                        const brandSuffix = p.brand ? ` Brand: ${p.brand} (by MY TECH)` : '';
                        const cleanItem = {
                            ...newArr[productModalTarget.index],
                            originalPrice: undefined,
                            calcBreakdown: undefined,
                            unitPrice: 0,
                            lineTotal: 0,
                            productId: p.id,
                            product: p,
                            serviceName: p.name + brandSuffix
                        };
                        newArr[productModalTarget.index] = calculateLocalItem(cleanItem, formData, listBasePrice);
                        setLocalItems(newArr);
                        
                        setShowLocalServices(true);
                        // Service syncing is now handled by the linkedId useEffect
                    }
                    setProductModalTarget(null);
                }}
            />

        </div>
        </>
    );
};

