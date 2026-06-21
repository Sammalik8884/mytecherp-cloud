import React, { useState, useEffect } from 'react';
import { procurementFlowService } from '../../services/procurementFlowService';
import { siteService } from '../../services/siteService';
import { CreateProcurementRequestDto, CreateProcurementItemDto } from '../../types/procurementFlow';
import { SiteDto } from '../../types/site';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateProcurementPage: React.FC = () => {
    const [siteId, setSiteId] = useState<string>('');
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [saveDefaultSite, setSaveDefaultSite] = useState<boolean>(false);
    const [items, setItems] = useState<CreateProcurementItemDto[]>([
        { itemName: '', quantity: 1, reason: '' }
    ]);
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
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={siteId}
                            onChange={(e) => setSiteId(e.target.value)}
                        >
                            <option value="">Select a Site...</option>
                            {sites.map(site => (
                                <option key={site.id} value={site.id}>
                                    {site.name} {site.city ? `(${site.city})` : ''}
                                </option>
                            ))}
                        </select>
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
                        <h2 className="text-lg font-semibold text-foreground mb-4">Requirements</h2>
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="flex flex-wrap md:flex-nowrap items-start gap-4 p-4 border border-border rounded-lg bg-background">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Item Name *</label>
                                        <input
                                            required
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={item.itemName}
                                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-full md:w-32">
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity *</label>
                                        <input
                                            required
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Reason (Optional)</label>
                                        <input
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={item.reason}
                                            onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                                        />
                                    </div>
                                    <div className="pt-6">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            disabled={items.length === 1}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-md disabled:opacity-50 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="mt-4 flex items-center space-x-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Row</span>
                        </button>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                        <button
                            type="button"
                            onClick={() => navigate('/procurement-flow/dashboard')}
                            className="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent hover:text-accent-foreground rounded-md mr-4 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProcurementPage;
