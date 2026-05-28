import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { materialReceivingService, MaterialReceivingItemDto } from "../../services/materialReceivingService";

const LOCATIONS = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Balochistan"];

export const ToolsListModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [location, setLocation] = useState("");
    const [items, setItems] = useState<MaterialReceivingItemDto[]>([
        { itemName: "", locationValue: "", received: "", remarks: "" }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener("OPEN_TOOLS_LIST_MODAL", handleOpen);
        return () => window.removeEventListener("OPEN_TOOLS_LIST_MODAL", handleOpen);
    }, []);

    const handleLocationChange = (val: string) => {
        setLocation(val);
        // Automatically populate locationValue for all items
        setItems(prev => prev.map(item => ({ ...item, locationValue: val })));
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, { itemName: "", locationValue: location, received: "", remarks: "" }]);
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
        if (!location) {
            toast.error("Please select a location.");
            return;
        }

        const validItems = items.filter(i => i.itemName.trim() !== "");
        if (validItems.length === 0) {
            toast.error("Please add at least one tool.");
            return;
        }

        setIsSubmitting(true);
        try {
            await materialReceivingService.createForm({
                location,
                items: validItems
            });
            toast.success("Tools list saved successfully!");
            handleClose();
            // Dispatch event if we need to refresh anything in the footer
            window.dispatchEvent(new CustomEvent('REFRESH_TOOLS_LIST'));
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save tools list");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setLocation("");
        setItems([{ itemName: "", locationValue: "", received: "", remarks: "" }]);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-4xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Tools List</h2>
                    <button onClick={handleClose} className="text-muted-foreground hover:bg-secondary p-2 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="tools-list-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Location <span className="text-destructive">*</span></label>
                            <select 
                                value={location} 
                                onChange={(e) => handleLocationChange(e.target.value)}
                                required
                                className="w-full md:w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">-- Select Location --</option>
                                {LOCATIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Tools / Items</h3>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="flex items-center space-x-1 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Add Item</span>
                                </button>
                            </div>

                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Item Name</th>
                                            <th className="px-4 py-3 font-medium">Location</th>
                                            <th className="px-4 py-3 font-medium">Received</th>
                                            <th className="px-4 py-3 font-medium">Remarks</th>
                                            <th className="px-4 py-3 font-medium w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((item, index) => (
                                            <tr key={index} className="bg-card">
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.itemName}
                                                        onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                                                        placeholder="Tool name"
                                                        className="w-full bg-transparent text-foreground border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-1"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.locationValue}
                                                        onChange={(e) => handleItemChange(index, "locationValue", e.target.value)}
                                                        placeholder="Location"
                                                        className="w-full bg-transparent text-foreground border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-1"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.received}
                                                        onChange={(e) => handleItemChange(index, "received", e.target.value)}
                                                        placeholder="Received"
                                                        className="w-full bg-transparent text-foreground border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-1"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.remarks}
                                                        onChange={(e) => handleItemChange(index, "remarks", e.target.value)}
                                                        placeholder="Remarks"
                                                        className="w-full bg-transparent text-foreground border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-1"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        disabled={items.length === 1}
                                                        className="text-muted-foreground hover:text-destructive p-1.5 rounded transition-colors disabled:opacity-50"
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
                        type="button" 
                        onClick={handleClose}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="tools-list-form"
                        disabled={isSubmitting || !location}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Save Tools List</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
