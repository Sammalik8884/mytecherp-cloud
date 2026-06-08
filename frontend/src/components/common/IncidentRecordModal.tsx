import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2 } from 'lucide-react';
import { incidentRecordService, IncidentRecord } from '../../services/incidentRecordService';
import { siteService } from '../../services/siteService';
import { SiteDto } from '../../types/site';

interface IncidentRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    record?: IncidentRecord | null;
    isViewOnly?: boolean;
    onSuccess?: () => void;
}

const DEFAULT_ITEMS = [
    { date: '', descriptionOfIncident: '', toWhom: '', department: '', correctiveAction: '', remarks: '' },
    { date: '', descriptionOfIncident: '', toWhom: '', department: '', correctiveAction: '', remarks: '' },
    { date: '', descriptionOfIncident: '', toWhom: '', department: '', correctiveAction: '', remarks: '' },
    { date: '', descriptionOfIncident: '', toWhom: '', department: '', correctiveAction: '', remarks: '' },
    { date: '', descriptionOfIncident: '', toWhom: '', department: '', correctiveAction: '', remarks: '' },
    { date: '', descriptionOfIncident: '', toWhom: '', department: '', correctiveAction: '', remarks: '' },
    { date: '', descriptionOfIncident: '', toWhom: '', department: '', correctiveAction: '', remarks: '' },
    { date: '', descriptionOfIncident: '', toWhom: '', department: '', correctiveAction: '', remarks: '' },
];

export const IncidentRecordModal: React.FC<IncidentRecordModalProps> = ({
    isOpen,
    onClose,
    record,
    isViewOnly = false,
    onSuccess
}) => {
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [siteId, setSiteId] = useState<number>(0);
    const [doc, setDoc] = useState('');
    const [issue, setIssue] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        siteService.getAll().then(setSites).catch(console.error);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (record) {
                setSiteId(record.siteId);
                setDoc(record.doc);
                setIssue(record.issue);
                // Extract date part only (YYYY-MM-DD)
                setIssueDate(record.issueDate ? new Date(record.issueDate).toISOString().split('T')[0] : '');
                
                // Format dates in items
                const formattedItems = (record.items || []).map(i => ({
                    ...i,
                    date: i.date ? new Date(i.date).toISOString().split('T')[0] : ''
                }));
                setItems(formattedItems);
            } else {
                setSiteId(0);
                setDoc('');
                setIssue('');
                setIssueDate(new Date().toISOString().split('T')[0]);
                setItems([...DEFAULT_ITEMS]);
            }
        }
    }, [isOpen, record]);

    if (!isOpen) return null;

    const handleAddCustomItem = () => {
        setItems([...items, { date: '', descriptionOfIncident: '', toWhom: '', department: '', correctiveAction: '', remarks: '' }]);
    };

    const handleRemoveCustomItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSave = async () => {
        if (!siteId) {
            toast.error('Please select a site.');
            return;
        }

        setIsSaving(true);
        try {
            const formattedItems = items.map(i => ({
                ...i,
                date: i.date || null
            }));

            const payload = {
                siteId,
                doc,
                issue,
                issueDate: issueDate || new Date().toISOString(),
                items: formattedItems
            };

            if (record && record.id) {
                await incidentRecordService.update(record.id, payload);
            } else {
                await incidentRecordService.create(payload);
            }

            toast.success(record ? 'Incident record updated successfully!' : 'Incident record saved successfully!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save incident record', error);
            toast.error('Failed to save incident record.');
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
            <div className="bg-background rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Incident Record</h2>
                        <p className="text-sm text-muted-foreground mt-1">Record and manage project incidents and corrective actions.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors group">
                        <X className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="space-y-8">
                        
                        {/* Top Info Section */}
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Select Project Site <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                        value={siteId}
                                        onChange={(e) => setSiteId(Number(e.target.value))}
                                        disabled={isViewOnly}
                                    >
                                        <option value={0}>-- Select Site --</option>
                                        {sites.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Doc</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                        value={doc}
                                        onChange={(e) => setDoc(e.target.value)}
                                        disabled={isViewOnly}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Issue</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                        value={issue}
                                        onChange={(e) => setIssue(e.target.value)}
                                        disabled={isViewOnly}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Issue Date</label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                            value={issueDate}
                                            onChange={(e) => setIssueDate(e.target.value)}
                                            disabled={isViewOnly}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Record Table */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-muted/50 py-4 text-center border-b border-border">
                                <h3 className="text-xl font-bold text-foreground">Incident Record</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-4 w-12 text-center font-semibold">S#</th>
                                            <th className="px-4 py-4 w-40 font-semibold text-center">Date</th>
                                            <th className="px-4 py-4 font-semibold text-center">Description Of Incident</th>
                                            <th className="px-4 py-4 w-48 font-semibold text-center">To Whom</th>
                                            <th className="px-4 py-4 w-48 font-semibold text-center">Department</th>
                                            <th className="px-4 py-4 font-semibold text-center">Corrective Action</th>
                                            <th className="px-4 py-4 font-semibold text-center">Remarks</th>
                                            {!isViewOnly && <th className="px-4 py-4 w-12 text-center"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((item, index) => (
                                            <tr key={index} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-3 text-center font-medium text-muted-foreground">{index + 1}:</td>
                                                <td className="px-2 py-3">
                                                    <input 
                                                        type="date" 
                                                        className="w-full p-2 bg-background border border-input rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        value={item.date}
                                                        onChange={(e) => updateItem(index, 'date', e.target.value)}
                                                        disabled={isViewOnly}
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        value={item.descriptionOfIncident}
                                                        onChange={(e) => updateItem(index, 'descriptionOfIncident', e.target.value)}
                                                        disabled={isViewOnly}
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        value={item.toWhom}
                                                        onChange={(e) => updateItem(index, 'toWhom', e.target.value)}
                                                        disabled={isViewOnly}
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        value={item.department}
                                                        onChange={(e) => updateItem(index, 'department', e.target.value)}
                                                        disabled={isViewOnly}
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        value={item.correctiveAction}
                                                        onChange={(e) => updateItem(index, 'correctiveAction', e.target.value)}
                                                        disabled={isViewOnly}
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        value={item.remarks}
                                                        onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                                                        disabled={isViewOnly}
                                                    />
                                                </td>
                                                {!isViewOnly && (
                                                    <td className="px-2 py-3 text-center">
                                                        <button 
                                                            onClick={() => handleRemoveCustomItem(index)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Remove Row"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Add Row Button */}
                            {!isViewOnly && (
                                <div className="p-4 border-t border-border bg-muted/10">
                                    <button 
                                        onClick={handleAddCustomItem}
                                        className="flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3 py-2 hover:bg-primary/5 rounded-lg"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Custom Row
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                        {isViewOnly ? "Close" : "Cancel"}
                    </button>
                    {!isViewOnly && (
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center shadow-sm"
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                    Saving...
                                </>
                            ) : "Save Incident Record"}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
