import React, { useState, useEffect } from 'react';
import { procurementFlowService } from '../../services/procurementFlowService';
import { siteService } from '../../services/siteService';
import { CreateProcurementRequestDto, CreateProcurementItemDto } from '../../types/procurementFlow';
import { SiteDto } from '../../types/site';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableObjectSelect } from '../../components/common/SearchableObjectSelect';

const CreateProcurementPage: React.FC = () => {
    const [siteId, setSiteId] = useState<string>('');
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [saveDefaultSite, setSaveDefaultSite] = useState<boolean>(false);
    const [items, setItems] = useState<CreateProcurementItemDto[]>([
        { itemName: '', quantity: 1, reason: '' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadSites = async () => {
            try {
                const data = await siteService.getAll();
                setSites(data);
            } catch (error) {
                console.error("Failed to load sites", error);
            }
        };
        loadSites();

        const savedSiteId = localStorage.getItem('defaultProcurementSiteId');
        if (savedSiteId) {
            setSiteId(savedSiteId);
            setSaveDefaultSite(true);
        }
    }, []);

    const handleItemChange = (index: number, field: keyof CreateProcurementItemDto, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { itemName: '', quantity: 1, reason: '' }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dto: CreateProcurementRequestDto = {
                siteId: siteId ? Number(siteId) : undefined,
                items
            };
            await procurementFlowService.create(dto);
            
            if (saveDefaultSite && siteId) {
                localStorage.setItem('defaultProcurementSiteId', siteId);
            } else {
                localStorage.removeItem('defaultProcurementSiteId');
            }

            toast.success('Procurement request created successfully');
            navigate('/procurement-flow/dashboard');
        } catch (error) {
            console.error('Failed to create procurement', error);
            toast.error('Failed to create procurement request');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Initiate Procurement Request</h1>
                <p className="text-sm text-muted-foreground mt-1">Submit a new request for required materials or items.</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="max-w-md">
                        <label className="block text-sm font-medium text-foreground mb-1">Site (Optional)</label>
                        <SearchableObjectSelect
                            options={sites.map(site => ({ label: `${site.name} ${site.city ? `(${site.city})` : ''}`, value: site.id }))}
                            value={siteId ? Number(siteId) : ""}
                            onChange={(val) => setSiteId(String(val))}
                            placeholder="Select a Site..."
                        />
                        <div className="mt-2 flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                id="saveDefaultSite" 
                                checked={saveDefaultSite}
                                onChange={(e) => setSaveDefaultSite(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="saveDefaultSite" className="text-sm text-muted-foreground flex items-center">
                                <Save className="h-3.5 w-3.5 mr-1" />
                                Save as default site for future requests
                            </label>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Requirements</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-sm flex items-center text-primary hover:text-primary/80"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Item
                            </button>
                        </div>
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 border border-border rounded-md bg-secondary/20">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1">Item Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    value={item.itemName}
                                                    onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                                    placeholder="e.g. Cement Bags"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Reason / Notes</label>
                                            <input
                                                type="text"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                value={item.reason}
                                                onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                                                placeholder="Optional reasoning..."
                                            />
                                        </div>
                                    </div>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="mt-6 text-destructive hover:text-destructive/80 p-2"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                        <button
                            type="button"
                            onClick={() => navigate('/procurement-flow/dashboard')}
                            className="mr-4 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || items.length === 0}
                            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow transition-colors disabled:opacity-50 flex items-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : (
                                "Submit Request"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProcurementPage;
