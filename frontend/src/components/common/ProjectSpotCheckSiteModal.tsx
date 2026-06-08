import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Upload, File as FileIcon } from 'lucide-react';
import { ProjectSpotCheckSite, projectSpotCheckSiteService } from '../../services/projectSpotCheckSiteService';
import { siteService } from '../../services/siteService';
import { SiteDto } from '../../types/site';

interface ProjectSpotCheckSiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    spotCheck?: ProjectSpotCheckSite | null;
    isViewOnly?: boolean;
    onSuccess?: () => void;
}

const DEFAULT_ITEMS = [
    "Security ID & Signboard provided at Project Entrance Area.",
    "Fire extinguisher installed at project layout office.",
    "First Aid Box prepared & Refilled at project office.",
    "Safety awareness signage available & installed within the site.",
    "All employees have undergone CIDB induction & Safety induction prior commencement.",
    "PTW system practiced at project site.",
    "Sub-con safety briefing attended.",
    "Lifting gear load test certificate & PMA certificate is valid.",
    "Competent lifting supervisor stationed.",
    "Safe Working procedure available.",
    "Hard barrier/Barricade covering hazardous area is installed.",
    "Scaffold is equipped with green tag prior to use.",
    "Fall arrest system / safety harness used.",
    "Edge protection is provided around open areas.",
    "Daily inspection performed by scaffolder.",
    "Daily inspection performed on excavator.",
    "Warning lights / hoarding installed.",
    "Fire extinguishers provided.",
    "Machinery operator have valid competency certificate.",
    "Proper earth grounding attached.",
    "PPE properly worn by all personnel.",
    "Warning signs are adequate.",
    "Electrical equipment in good condition.",
    "Spill kit available on site.",
    "Welfare facilities maintained.",
    "Housekeeping is satisfactory."
];

export const ProjectSpotCheckSiteModal: React.FC<ProjectSpotCheckSiteModalProps> = ({
    isOpen,
    onClose,
    spotCheck,
    isViewOnly = false,
    onSuccess
}) => {
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [siteId, setSiteId] = useState<number>(0);
    const [items, setItems] = useState<any[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        siteService.getAll().then(setSites).catch(console.error);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (spotCheck) {
                setSiteId(spotCheck.siteId);
                setItems(spotCheck.items || []);
                try {
                    setUploadedFiles(spotCheck.uploadedFiles ? JSON.parse(spotCheck.uploadedFiles) : []);
                } catch {
                    setUploadedFiles([]);
                }
            } else {
                setSiteId(0);
                setItems(DEFAULT_ITEMS.map(text => ({
                    itemText: text,
                    isYes: false,
                    isNA: false,
                    comments: ''
                })));
                setUploadedFiles([]);
            }
        }
    }, [isOpen, spotCheck]);

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const newUploadedFiles = [...uploadedFiles];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const base64Url = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
                newUploadedFiles.push({ name: file.name, url: base64Url });
            }
            setUploadedFiles(newUploadedFiles);
        } catch (error) {
            console.error('Failed to process files', error);
            alert('Failed to process files.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = (index: number) => {
        if (isViewOnly) return;
        const newFiles = [...uploadedFiles];
        newFiles.splice(index, 1);
        setUploadedFiles(newFiles);
    };

    const handleAddCustomItem = () => {
        setItems([...items, { itemText: '', isYes: false, isNA: false, comments: '' }]);
    };

    const handleRemoveCustomItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        
        // Mutually exclusive Yes/No vs NA logic can be added here if desired.
        if (field === 'isYes' && value === true) {
            newItems[index].isNA = false;
        } else if (field === 'isNA' && value === true) {
            newItems[index].isYes = false;
        }

        setItems(newItems);
    };

    const handleSave = async () => {
        if (!siteId) {
            alert('Please select a site.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                siteId,
                items,
                uploadedFiles: uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : undefined
            };

            if (spotCheck && spotCheck.id) {
                await projectSpotCheckSiteService.update(spotCheck.id, payload);
            } else {
                await projectSpotCheckSiteService.create(payload);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save', error);
            alert('Failed to save project spot check site.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
            <div className="bg-background rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Project Spot Check Site</h2>
                        <p className="text-sm text-muted-foreground mt-1">Review and verify safety compliance for the selected site.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors group">
                        <X className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="space-y-8">
                        
                        {/* Site Selection */}
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                            <label className="block text-sm font-semibold text-foreground mb-2">Select Project Site <span className="text-red-500">*</span></label>
                            <select
                                className="w-full sm:w-1/2 p-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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

                        {/* Checklist Table */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-4 w-16 text-center font-semibold">No.</th>
                                            <th className="px-4 py-4 font-semibold">Items</th>
                                            <th className="px-4 py-4 w-24 text-center font-semibold">Yes/No</th>
                                            <th className="px-4 py-4 w-24 text-center font-semibold">NA</th>
                                            <th className="px-4 py-4 font-semibold">Comments/Action Required</th>
                                            {!isViewOnly && <th className="px-4 py-4 w-16 text-center"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((item, index) => (
                                            <tr key={index} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-4 text-center font-medium text-muted-foreground">{index + 1}</td>
                                                <td className="px-4 py-4">
                                                    {index < DEFAULT_ITEMS.length ? (
                                                        <span className="text-foreground">{item.itemText}</span>
                                                    ) : (
                                                        <input 
                                                            type="text" 
                                                            className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                            value={item.itemText}
                                                            onChange={(e) => updateItem(index, 'itemText', e.target.value)}
                                                            disabled={isViewOnly}
                                                            placeholder="Enter custom item..."
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 text-primary border-input rounded focus:ring-primary bg-background"
                                                        checked={item.isYes}
                                                        onChange={(e) => updateItem(index, 'isYes', e.target.checked)}
                                                        disabled={isViewOnly}
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 text-primary border-input rounded focus:ring-primary bg-background"
                                                        checked={item.isNA}
                                                        onChange={(e) => updateItem(index, 'isNA', e.target.checked)}
                                                        disabled={isViewOnly}
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        value={item.comments || ''}
                                                        onChange={(e) => updateItem(index, 'comments', e.target.value)}
                                                        disabled={isViewOnly}
                                                        placeholder="Comments..."
                                                    />
                                                </td>
                                                {!isViewOnly && (
                                                    <td className="px-4 py-4 text-center">
                                                        {index >= DEFAULT_ITEMS.length && (
                                                            <button 
                                                                onClick={() => handleRemoveCustomItem(index)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Remove Item"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
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
                                        <Plus className="h-4 w-4 mr-2" /> Add Custom Item
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* File Upload Section */}
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-foreground flex items-center mb-4">
                                <Upload className="h-5 w-5 mr-2 text-primary" />
                                Attachments
                            </h3>
                            
                            {!isViewOnly && (
                                <div className="mb-4">
                                    <label className="flex items-center justify-center w-full sm:w-64 h-32 border-2 border-dashed border-primary/30 rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                                        <div className="text-center">
                                            <Upload className="h-8 w-8 text-primary mx-auto mb-2 opacity-70" />
                                            <span className="text-sm font-medium text-foreground">Click to upload files</span>
                                        </div>
                                        <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                                    </label>
                                    {isUploading && <p className="text-sm text-primary mt-2 flex items-center"><div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div> Uploading...</p>}
                                </div>
                            )}

                            {uploadedFiles.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {uploadedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30 group">
                                            <a href={file.url} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-primary hover:underline truncate">
                                                <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                                <span className="truncate">{file.name}</span>
                                            </a>
                                            {!isViewOnly && (
                                                <button onClick={() => handleRemoveFile(idx)} className="p-1 text-muted-foreground hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {uploadedFiles.length === 0 && isViewOnly && (
                                <p className="text-sm text-muted-foreground">No files attached.</p>
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
                            ) : "Save Spot Check Site"}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
