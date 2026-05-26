import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Loader2, File } from "lucide-react";
import { toast } from "react-hot-toast";
import { siteDocumentService } from "../../services/siteDocumentService";
import { siteService } from "../../services/siteService";
import { customerService } from "../../services/customerService";
import { SiteDto } from "../../types/site";
import { CustomerDto } from "../../types/customer";

export const ProjectScopeModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [customers, setCustomers] = useState<CustomerDto[]>([]);
    
    const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
    const [selectedSecondaryCustomerId, setSelectedSecondaryCustomerId] = useState<number | "">("");
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            loadData();
        };
        window.addEventListener("OPEN_PROJECT_SCOPE_MODAL", handleOpen);
        return () => window.removeEventListener("OPEN_PROJECT_SCOPE_MODAL", handleOpen);
    }, []);

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
        if (files.length === 0) {
            toast.error("Please select at least one file.");
            return;
        }

        setIsSubmitting(true);
        try {
            await siteDocumentService.uploadDocuments(
                Number(selectedSiteId),
                "Project Scope",
                selectedCustomerId ? Number(selectedCustomerId) : undefined,
                selectedSecondaryCustomerId ? Number(selectedSecondaryCustomerId) : undefined,
                files
            );
            toast.success("Project Scope uploaded successfully!");
            
            // Dispatch event to refresh documents if we are on the project details page
            window.dispatchEvent(new CustomEvent('REFRESH_PROJECT_DOCUMENTS', { detail: { siteId: Number(selectedSiteId) } }));
            
            handleClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to upload document");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setSelectedSiteId("");
        setSelectedCustomerId("");
        setSelectedSecondaryCustomerId("");
        setFiles([]);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Project Scope</h2>
                    <button onClick={handleClose} className="text-muted-foreground hover:bg-secondary p-2 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="project-scope-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Customer Name (Optional)</label>
                                <select 
                                    value={selectedCustomerId} 
                                    onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : "")}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">-- Select Secondary Customer --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Project Name <span className="text-destructive">*</span></label>
                            <select 
                                value={selectedSiteId} 
                                onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : "")}
                                required
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">-- Select Project (Site) --</option>
                                {sites.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} - {s.address}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Project Scope Files <span className="text-destructive">*</span></label>
                            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-secondary/30 relative hover:bg-secondary/50 transition-colors">
                                <input 
                                    type="file" 
                                    multiple 
                                    onChange={handleFileChange} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground font-medium">Click or drag files to upload</span>
                            </div>

                            {files.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 border border-border rounded-lg">
                                            <div className="flex items-center space-x-3 truncate">
                                                <File className="h-4 w-4 text-primary shrink-0" />
                                                <span className="text-sm truncate font-medium">{file.name}</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveFile(idx)}
                                                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
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
                        onClick={handleClose}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="project-scope-form"
                        disabled={isSubmitting || !selectedSiteId || files.length === 0}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span>Upload & Save</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
