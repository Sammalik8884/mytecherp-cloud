import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { materialReceivingService, MaterialReceivingItemDto } from "../../services/materialReceivingService";
import { siteService } from "../../services/siteService";
import { SiteDto } from "../../types/site";

export const ToolsListModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [siteId, setSiteId] = useState<number | "">("");
    
    // Initialize 10 empty rows by default
    const [items, setItems] = useState<MaterialReceivingItemDto[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            loadSites();
            setItems([{ itemName: "", locationValue: "", received: "", remarks: "" }]);
        };
        window.addEventListener("OPEN_TOOLS_LIST_MODAL", handleOpen);
        return () => window.removeEventListener("OPEN_TOOLS_LIST_MODAL", handleOpen);
    }, []);

    const loadSites = async () => {
        try {
            const data = await siteService.getAll();
            setSites(data);
        } catch (error) {
            console.error("Failed to load sites", error);
        }
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, { itemName: "", locationValue: "", received: "", remarks: "" }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof MaterialReceivingItemDto, value: string) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!siteId) {
            toast.error("Please select a site.");
            return;
        }

        const validItems = items.filter(i => i.itemName.trim() !== "" || i.locationValue.trim() !== "" || i.received.trim() !== "" || i.remarks.trim() !== "");
        if (validItems.length === 0) {
            toast.error("Please add at least one item.");
            return;
        }

        setIsSubmitting(true);
        try {
            await materialReceivingService.createForm({
                siteId: Number(siteId),
                items: validItems
            });
            toast.success("Project Tool Site saved successfully!");
            handleClose();
            window.dispatchEvent(new CustomEvent('REFRESH_PROJECT_DOCUMENTS'));
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save Project Tool Site");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setSiteId("");
        setItems([]);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-5xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border bg-emerald-100/50 dark:bg-emerald-900/20">
                    <div className="flex-1 text-center relative">
                        <h2 className="text-2xl font-bold inline-block bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-100 px-6 py-2 rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-800/50">Project Tool Site</h2>
                        <button onClick={handleClose} className="text-muted-foreground hover:bg-secondary p-2 rounded-full transition-colors absolute right-0 top-1/2 -translate-y-1/2">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="tools-list-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Site <span className="text-destructive">*</span></label>
                            <select 
                                value={siteId} 
                                onChange={(e) => setSiteId(Number(e.target.value))}
                                required
                                className="w-full md:w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">-- Select Site --</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg">Items</h3>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="flex items-center space-x-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="font-medium">Add Row</span>
                                </button>
                            </div>

                            <div className="border border-border rounded-lg overflow-hidden bg-white dark:bg-card">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary/30 text-foreground border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold w-16">No.</th>
                                            <th className="px-4 py-3 font-semibold">Items</th>
                                            <th className="px-4 py-3 font-semibold">Deliverd</th>
                                            <th className="px-4 py-3 font-medium">Recieved</th>
                                            <th className="px-4 py-3 font-semibold">Remarks</th>
                                            <th className="px-4 py-3 font-semibold w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((item, index) => (
                                            <tr key={index} className="bg-transparent hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-3 text-center text-muted-foreground font-medium">
                                                    {index + 1}:
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.itemName}
                                                        onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                                                        className="w-full bg-background text-foreground border border-input rounded hover:border-border focus:border-primary focus:outline-none py-1.5 px-2"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.locationValue}
                                                        onChange={(e) => handleItemChange(index, "locationValue", e.target.value)}
                                                        className="w-full bg-background text-foreground border border-input rounded hover:border-border focus:border-primary focus:outline-none py-1.5 px-2"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.received}
                                                        onChange={(e) => handleItemChange(index, "received", e.target.value)}
                                                        className="w-full bg-background text-foreground border border-input rounded hover:border-border focus:border-primary focus:outline-none py-1.5 px-2"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.remarks}
                                                        onChange={(e) => handleItemChange(index, "remarks", e.target.value)}
                                                        className="w-full bg-background text-foreground border border-input rounded hover:border-border focus:border-primary focus:outline-none py-1.5 px-2"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
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
                    </form>
                </div>

                <div className="p-6 border-t border-border flex justify-end space-x-3 bg-secondary/10">
                    <button 
                        type="submit" 
                        form="tools-list-form"
                        disabled={isSubmitting || !siteId}
                        className="px-8 py-2.5 bg-emerald-500 text-white font-medium rounded hover:bg-emerald-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        <span>Submit</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
