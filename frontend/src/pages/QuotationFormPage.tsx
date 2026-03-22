import { useState, useEffect } from "react";
import { Save, Plus, Trash2, ArrowLeft, Loader2, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { quotationService, CreateQuotationDto, CreateQuotationItemDto } from "../services/quotationService";
import { customerService } from "../services/customerService";
import { siteService } from "../services/siteService";
import { productService } from "../services/productService";

import { CustomerDto } from "../types/customer";
import { SiteDto } from "../types/site";
import { ProductDto } from "../types/product";
import { AssetDto } from "../types/field";
import { apiClient } from "../services/apiClient";

export const QuotationFormPage = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // Per-row product search query
    const [productSearch, setProductSearch] = useState<string[]>([]);

    const [customers, setCustomers] = useState<CustomerDto[]>([]);
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [assets, setAssets] = useState<AssetDto[]>([]);

    const [formData, setFormData] = useState<CreateQuotationDto>({
        customerId: 0,
        siteId: undefined,
        assetId: undefined,
        currency: "PKR",
        exchangeRate: 1.0,
        globalCommissionPct: 0,
        gstPercentage: 0,
        incomeTaxPercentage: 0,
        adjustment: 0,
        items: []
    });

    // We maintain a UI-specific items array to hold product details for calculations
    const [uiItems, setUiItems] = useState<(CreateQuotationItemDto & { product?: ProductDto, unitPrice: number, lineTotal: number })[]>([]);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoading(true);
                const [custData, siteData, prodData, assetData] = await Promise.all([
                    customerService.getAll(),
                    siteService.getAll(),
                    productService.getAll(1, 1000),
                    apiClient.get<AssetDto[]>("/Assets").then(r => r.data)
                ]);
                setCustomers(custData);
                setSites(siteData);
                setAssets(Array.isArray(assetData) ? assetData : (assetData as any).data || []);
                // productService returns a paged response; unwrap items from .data property
                const rawProds = prodData as any;
                const prodArray: ProductDto[] = Array.isArray(rawProds)
                    ? rawProds
                    : Array.isArray(rawProds?.data) ? rawProds.data : [];
                setProducts(prodArray);

                if (isEditMode) {
                    const quote = await quotationService.getQuotationById(Number(id));
                    setFormData({
                        customerId: quote.customerId,
                        siteId: quote.siteName ? siteData.find(s => s.name === quote.siteName)?.id : undefined,
                        currency: quote.currency,
                        exchangeRate: 1.0, // Backend doesn't return this in Dto, assume 1.0 or need to handle differently
                        globalCommissionPct: 0, // Backend doesn't expose this currently
                        gstPercentage: quote.gstPercentage,
                        incomeTaxPercentage: quote.incomeTaxPercentage,
                        adjustment: quote.adjustment,
                        items: quote.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
                    });

                    const editUiItems = quote.items.map(i => {
                        const p = (Array.isArray(prodData) ? prodData : (prodData as any).data || []).find((prod: any) => prod.id === i.productId);
                        return {
                            productId: i.productId,
                            quantity: i.quantity,
                            product: p,
                            unitPrice: i.unitPrice,
                            lineTotal: i.lineTotal
                        };
                    });
                    setUiItems(editUiItems);
                } else {
                    // Add one empty row by default
                    setUiItems([{ productId: 0, quantity: 1, unitPrice: 0, lineTotal: 0 }]);
                    setProductSearch([""]);
                }
            } catch (error) {
                toast.error("Failed to load form dependencies.");
            } finally {
                setLoading(false);
            }
        };

        fetchDependencies();
    }, [id, isEditMode]);

    const availableSites = sites.filter(s => s.customerId === formData.customerId);

    // Grid Actions
    const handleAddRow = () => {
        setUiItems([...uiItems, { productId: 0, quantity: 1, unitPrice: 0, lineTotal: 0 }]);
        setProductSearch([...productSearch, ""]);
    };

    const handleRemoveRow = (index: number) => {
        setUiItems(uiItems.filter((_, i) => i !== index));
        setProductSearch(productSearch.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...uiItems];
        const item = newItems[index];

        if (field === "productId") {
            const product = products.find(p => p.id === Number(value));
            item.productId = Number(value);
            item.product = product;
            item.unitPrice = product ? product.price : 0;
            const newSearch = [...productSearch];
            newSearch[index] = "";
            setProductSearch(newSearch);
        } else if (field === "quantity") {
            item.quantity = Number(value);
        } else if (field === "manualCommissionPct") {
            item.manualCommissionPct = Number(value);
        }

        // Recalculate line total (Simplified UI prediction before backend calcs it exactly)
        item.lineTotal = item.quantity * item.unitPrice * (1 - (item.manualCommissionPct || 0) / 100);
        newItems[index] = item;
        setUiItems(newItems);
    };

    // Calculate totals for UI Preview
    const subTotal = uiItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const gstAmount = subTotal * (formData.gstPercentage / 100);
    const incomeTaxAmount = subTotal * (formData.incomeTaxPercentage / 100);
    const grandTotal = subTotal + gstAmount + incomeTaxAmount - formData.adjustment;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.customerId === 0) {
            toast.error("Please select a customer."); return;
        }

        const validItems = uiItems.filter(i => i.productId !== 0 && i.quantity > 0);
        if (validItems.length === 0) {
            toast.error("Please add at least one valid product line item."); return;
        }

        setSaving(true);
        try {
            const payload: CreateQuotationDto = {
                ...formData,
                items: validItems.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    manualCommissionPct: i.manualCommissionPct
                }))
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
            const data = error.response?.data;
            let msg = "Error saving quotation";
            if (data) {
                if (typeof data === "string") msg = data;
                else if (data.error) msg = data.error;
                else if (data.Error) msg = data.Error;
                else if (data.message) msg = data.message;
                else if (data.Message) msg = data.Message;
                else {
                    // ASP.NET ModelState validation errors: { "FieldName": ["error1"] }
                    const firstKey = Object.keys(data.errors || data)[0];
                    const firstKeyData = (data.errors || data)[firstKey];
                    if (Array.isArray(firstKeyData)) msg = `${firstKey}: ${firstKeyData[0]}`;
                }
            }
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center space-x-4 mb-8">
                <button
                    onClick={() => navigate('/quotations')}
                    className="p-2 hover:bg-secondary/50 rounded-lg transition-colors text-muted-foreground"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        {isEditMode ? "Edit Quotation" : "Create Quotation"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Build a detailed sales quotation for your customer.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Header Information */}
                <div className="bg-secondary/30 border border-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-6">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border/50 pb-2 mb-4">Header Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer *</label>
                            <select
                                required
                                value={formData.customerId}
                                onChange={e => {
                                    setFormData({ ...formData, customerId: Number(e.target.value), siteId: 0, assetId: undefined });
                                }}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            >
                                <option value={0} disabled>Select a customer...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Site Location</label>
                            <select
                                value={formData.siteId || 0}
                                onChange={e => setFormData({ ...formData, siteId: Number(e.target.value) || undefined })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                                disabled={!formData.customerId || availableSites.length === 0}
                            >
                                <option value={0}>Standard / No Site</option>
                                {availableSites.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} - {s.city}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            >
                                <option value="PKR">PKR (Pakistani Rupee)</option>
                                <option value="USD">USD (US Dollar)</option>
                                <option value="AED">AED (Emirati Dirham)</option>
                                <option value="EUR">EUR (Euro)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Exchange Rate</label>
                            <input
                                type="number" step="0.01" min="0" required
                                value={formData.exchangeRate}
                                onChange={e => setFormData({ ...formData, exchangeRate: Number(e.target.value) })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Asset Row – full width */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1 block">
                            Linked Asset
                            <span className="text-yellow-400 text-[10px] font-normal">(required to Initialize a Work Order)</span>
                        </label>
                        <select
                            value={formData.assetId || 0}
                            onChange={e => setFormData({ ...formData, assetId: Number(e.target.value) || undefined })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value={0}>-- No Asset Linked --</option>
                            {assets.map(a => (
                                <option key={a.id} value={a.id}>
                                    [{a.assetType}] {a.name} — S/N: {a.serialNumber}{a.siteName ? ` (${a.siteName})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Line Items Grid */}
                <div className="bg-secondary/30 border border-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                    <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Line Items</h3>
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors flex items-center space-x-1"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Product</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                                <tr>
                                    <th className="px-4 py-3 font-medium w-1/3">Product</th>
                                    <th className="px-4 py-3 font-medium w-24">Quantity</th>
                                    <th className="px-4 py-3 font-medium w-32">Unit Price</th>
                                    <th className="px-4 py-3 font-medium w-32">Discount %</th>
                                    <th className="px-4 py-3 font-medium w-32 text-right">Line Total</th>
                                    <th className="px-4 py-3 font-medium w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {uiItems.map((item, index) => (
                                    <tr key={index} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-4 py-2">
                                            <div className="relative">
                                                <div className="flex items-center border border-border rounded-md px-2 bg-background mb-1">
                                                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search product..."
                                                        value={productSearch[index] || ""}
                                                        onChange={e => {
                                                            const s = [...productSearch];
                                                            s[index] = e.target.value;
                                                            setProductSearch(s);
                                                        }}
                                                        className="w-full bg-transparent py-1.5 px-1 text-sm focus:outline-none"
                                                    />
                                                </div>
                                                <select
                                                    value={item.productId}
                                                    onChange={e => handleItemChange(index, "productId", e.target.value)}
                                                    size={productSearch[index] ? 4 : 1}
                                                    className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary"
                                                >
                                                    <option value={0} disabled>Select Product...</option>
                                                    {products
                                                        .filter(p => {
                                                            const q = (productSearch[index] || "").toLowerCase();
                                                            if (!q) return true;
                                                            return p.name.toLowerCase().includes(q) ||
                                                                (p.itemCode || "").toLowerCase().includes(q);
                                                        })
                                                        .map(p => (
                                                            <option key={p.id} value={p.id}>{p.itemCode ? `[${p.itemCode}] ` : ''}{p.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number" min="1" step="1" required
                                                value={item.quantity}
                                                onChange={e => handleItemChange(index, "quantity", e.target.value)}
                                                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-muted-foreground">
                                            {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number" min="0" max="100" step="0.1"
                                                value={item.manualCommissionPct || ""}
                                                onChange={e => handleItemChange(index, "manualCommissionPct", e.target.value)}
                                                placeholder="0%"
                                                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium text-foreground">
                                            {item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(index)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Totals & Taxes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-secondary/30 border border-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b border-border/50 pb-2 mb-4">Taxes & Adjustments</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">GST (%)</label>
                                <input
                                    type="number" step="0.1" min="0" required
                                    value={formData.gstPercentage}
                                    onChange={e => setFormData({ ...formData, gstPercentage: Number(e.target.value) })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Income Tax (%)</label>
                                <input
                                    type="number" step="0.1" min="0" required
                                    value={formData.incomeTaxPercentage}
                                    onChange={e => setFormData({ ...formData, incomeTaxPercentage: Number(e.target.value) })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Global Discount (%)</label>
                                <input
                                    type="number" step="0.1" min="0" max="100" required
                                    value={formData.globalCommissionPct}
                                    onChange={e => setFormData({ ...formData, globalCommissionPct: Number(e.target.value) })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Adjustment Amount (-)</label>
                                <input
                                    type="number" step="0.01" min="0" required
                                    value={formData.adjustment}
                                    onChange={e => setFormData({ ...formData, adjustment: Number(e.target.value) })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-center">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Sub Total</span>
                                <span>{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            {formData.gstPercentage > 0 && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>GST ({formData.gstPercentage}%)</span>
                                    <span>+ {gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {formData.incomeTaxPercentage > 0 && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Income Tax ({formData.incomeTaxPercentage}%)</span>
                                    <span>+ {incomeTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {formData.adjustment > 0 && (
                                <div className="flex justify-between text-sm text-emerald-400">
                                    <span>Adjustment</span>
                                    <span>- {formData.adjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="border-t border-border/50 pt-3 flex justify-between items-end">
                                <span className="text-lg font-semibold text-foreground">Grand Total</span>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-primary">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    <span className="text-sm text-muted-foreground ml-2">{formData.currency}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/quotations')}
                                className="px-6 py-2.5 text-sm font-medium hover:bg-secondary/50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || uiItems.filter(i => i.productId !== 0).length === 0}
                                className="px-6 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:-translate-y-0.5 transition-transform flex items-center space-x-2 shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                <span>{isEditMode ? "Update Quotation" : "Save Quotation"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
