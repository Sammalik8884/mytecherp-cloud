import React, { useState, useEffect } from 'react';
import { Loader2, Building2 } from 'lucide-react';
import { siteService } from '../../services/siteService';
import { customerService } from '../../services/customerService';
import toast from 'react-hot-toast';
import { SearchableObjectSelect } from './SearchableObjectSelect';

interface AddSiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddSiteModal: React.FC<AddSiteModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
    
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        city: "",
        customerId: "" as number | ""
    });

    useEffect(() => {
        if (isOpen) {
            loadCustomers();
            setFormData({ name: "", address: "", city: "", customerId: "" });
        }
    }, [isOpen]);

    const loadCustomers = async () => {
        try {
            const data = await customerService.getAll();
            setCustomers(data);
        } catch (error) {
            console.error("Failed to load customers", error);
            toast.error("Failed to load customers");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) return toast.error("Site name is required");
        if (!formData.address.trim()) return toast.error("Address is required");
        if (!formData.city.trim()) return toast.error("City is required");
        if (!formData.customerId) return toast.error("Please select a customer");

        try {
            setIsSubmitting(true);
            await siteService.create({
                name: formData.name,
                address: formData.address,
                city: formData.city,
                customerId: Number(formData.customerId)
            });
            toast.success("Site added successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Failed to add site", error);
            toast.error(error.response?.data?.Message || error.response?.data?.Error || "Failed to add site");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => !isSubmitting && onClose()} />
            <div className="bg-background border border-border p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Building2 className="text-primary h-6 w-6" /> Add New Site
                    </h2>
                    <button onClick={() => !isSubmitting && onClose()} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">Site Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Downtown Plaza"
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">Address *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 123 Main St"
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">City *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. New York"
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">Customer *</label>
                        <SearchableObjectSelect
                            options={customers.map(c => ({ label: c.name, value: c.id }))}
                            value={formData.customerId}
                            onChange={(val) => setFormData({ ...formData, customerId: val as number | "" })}
                            placeholder="Select a Customer..."
                        />
                    </div>

                    <div className="pt-4 border-t border-border mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center disabled:opacity-50"
                        >
                            {isSubmitting ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...</> : "Save Site"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
