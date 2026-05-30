import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Loader2, File, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import { siteService } from "../../services/siteService";
import { customerService } from "../../services/customerService";
import { SiteDto } from "../../types/site";
import { CustomerDto } from "../../types/customer";
import projectTechnicalHandoverService, { ProjectTechnicalHandoverDto, ProjectTechnicalHandoverAttachmentDto } from "../../services/projectTechnicalHandoverService";

interface ProjectTechnicalHandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    handoverData: ProjectTechnicalHandoverDto | null;
    isViewOnly?: boolean;
    onSaveSuccess: () => void;
}

export const ProjectTechnicalHandoverModal = ({ isOpen, onClose, handoverData, isViewOnly, onSaveSuccess }: ProjectTechnicalHandoverModalProps) => {
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [customers, setCustomers] = useState<CustomerDto[]>([]);
    
    const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
    const [selectedSecondaryCustomerId, setSelectedSecondaryCustomerId] = useState<number | "">("");
    const [files, setFiles] = useState<File[]>([]);
    const [existingFiles, setExistingFiles] = useState<ProjectTechnicalHandoverAttachmentDto[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
            if (handoverData) {
                setSelectedSiteId(handoverData.siteId);
                setSelectedCustomerId(handoverData.customerId || "");
                setSelectedSecondaryCustomerId(handoverData.secondaryCustomerId || "");
                setExistingFiles(handoverData.attachments || []);
            } else {
                setSelectedSiteId("");
                setSelectedCustomerId("");
                setSelectedSecondaryCustomerId("");
                setExistingFiles([]);
            }
            setFiles([]);
        }
    }, [isOpen, handoverData]);

    const loadData = async () => {
        try {
            const [sitesData, customersData] = await Promise.all([
                siteService.getAll(),
                customerService.getAll()
            ]);
            setSites(sitesData);
            setCustomers(customersData);
        } catch (error) {
            console.error("Failed to load options", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSiteId) {
            toast.error("Please select a project.");
            return;
        }
        if (files.length === 0 && existingFiles.length === 0) {
            toast.error("Please select at least one file.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Note: Our backend update logic completely replaces old files with new ones.
            // If we are editing, the user has to re-upload files if they want to change them.
            // Wait, actually I wrote the backend to clear old attachments if new ones are uploaded.
            // But if `files` is empty, it does not clear old attachments. So it's fine.

            const payload = {
                siteId: Number(selectedSiteId),
                customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
                secondaryCustomerId: selectedSecondaryCustomerId ? Number(selectedSecondaryCustomerId) : undefined,
                attachments: files
            };

            if (handoverData) {
                await projectTechnicalHandoverService.update(handoverData.id, payload);
                toast.success(`Project Technical Handover updated successfully!`);
            } else {
                await projectTechnicalHandoverService.create(payload);
                toast.success(`Project Technical Handover created successfully!`);
            }
            
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save document");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">{isViewOnly ? "View " : handoverData ? "Edit " : "Create "}Project Technical Handover</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:bg-secondary p-2 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="handover-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Customer Name (Optional)</label>
                                <select 
                                    value={selectedCustomerId} 
                                    onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : "")}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                    disabled={isViewOnly}
                                >
                                    <option value="">-- Select Customer --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Secondary Customer Name (Optional)</label>
                                <select 
                                    value={selectedSecondaryCustomerId} 
                                    onChange={(e) => setSelectedSecondaryCustomerId(e.target.value ? Number(e.target.value) : "")}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                    disabled={isViewOnly}
                                >
                                    <option value="">-- Select Secondary Customer --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Project Name (Site) <span className="text-destructive">*</span></label>
                            <select 
                                value={selectedSiteId} 
                                onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : "")}
                                required
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                disabled={isViewOnly}
                            >
                                <option value="">-- Select Project (Site) --</option>
                                {sites.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} - {s.address}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Project Technical Handover Files <span className="text-destructive">*</span></label>
                            
                            {!isViewOnly && (
                                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-secondary/30 relative hover:bg-secondary/50 transition-colors">
                                    <input 
                                        type="file" 
                                        multiple 
                                        onChange={handleFileChange} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground font-medium">
                                        {handoverData ? "Upload new files to completely replace existing ones" : "Click or drag files to upload"}
                                    </span>
                                </div>
                            )}

                            {existingFiles.length > 0 && files.length === 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Attached Files:</p>
                                    {existingFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 border border-border rounded-lg">
                                            <div className="flex items-center space-x-3 truncate">
                                                <File className="h-4 w-4 text-primary shrink-0" />
                                                <span className="text-sm truncate font-medium">{file.fileName}</span>
                                            </div>
                                            <a 
                                                href={file.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-primary/80 p-1 rounded transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {files.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">New Files to Upload:</p>
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 border border-border rounded-lg">
                                            <div className="flex items-center space-x-3 truncate">
                                                <File className="h-4 w-4 text-primary shrink-0" />
                                                <span className="text-sm truncate font-medium">{file.name}</span>
                                            </div>
                                            {!isViewOnly && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveFile(idx)}
                                                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border flex justify-end space-x-3 bg-secondary/10">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                        disabled={isSubmitting}
                    >
                        {isViewOnly ? "Close" : "Cancel"}
                    </button>
                    {!isViewOnly && (
                        <button 
                            type="submit" 
                            form="handover-form"
                            disabled={isSubmitting || !selectedSiteId || (files.length === 0 && existingFiles.length === 0)}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            <span>{handoverData ? "Update & Save" : "Upload & Save"}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
