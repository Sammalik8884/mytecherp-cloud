import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { TermsAndConditionsTemplate, termsAndConditionsService } from '../services/termsAndConditionsService';

interface Props {
    valueJson: string | undefined;
    onChangeJson: (json: string) => void;
}

// Auto-resizing textarea wrapper
const AutoResizeTextarea = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <div className="flex flex-col space-y-1 mb-4">
            <label className="text-sm font-medium text-foreground">{label}</label>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    adjustHeight();
                }}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none overflow-hidden resize-none min-h-[60px]"
                placeholder={`Enter ${label} details...`}
                rows={1}
            />
        </div>
    );
};

export const TermsAndConditionsSection: React.FC<Props> = ({ valueJson, onChangeJson }) => {
    const [templates, setTemplates] = useState<TermsAndConditionsTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    
    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        defaultValue: string;
        onConfirm: (val: string) => void;
    } | null>(null);
    const [modalInputValue, setModalInputValue] = useState("");
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // Searchable dropdown state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Current form state
    const [tAndC, setTAndC] = useState({
        paymentAndTax: '',
        delivery: '',
        warranty: '',
        purchaseOrder: '',
        validityAndTransportation: '',
        general: ''
    });

    // Parse initial value once if provided
    useEffect(() => {
        if (valueJson) {
            try {
                const parsed = JSON.parse(valueJson);
                setTAndC({
                    paymentAndTax: parsed.paymentAndTax || '',
                    delivery: parsed.delivery || '',
                    warranty: parsed.warranty || '',
                    purchaseOrder: parsed.purchaseOrder || '',
                    validityAndTransportation: parsed.validityAndTransportation || '',
                    general: parsed.general || ''
                });
            } catch (e) {
                console.error("Failed to parse Terms and Conditions JSON");
            }
        }
    }, [valueJson]);

    const fetchTemplates = async () => {
        try {
            const data = await termsAndConditionsService.getAll();
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates', error);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Load default template ONLY if creating new quotation (valueJson is empty)
    useEffect(() => {
        if (!valueJson) {
            const loadDefault = async () => {
                try {
                    const defaultTemplate = await termsAndConditionsService.getDefault();
                    if (defaultTemplate) {
                        applyTemplate(defaultTemplate);
                    }
                } catch (error) {
                    console.error('Error loading default template', error);
                }
            };
            loadDefault();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const applyTemplate = (template: TermsAndConditionsTemplate) => {
        const newTC = {
            paymentAndTax: template.paymentAndTax || '',
            delivery: template.delivery || '',
            warranty: template.warranty || '',
            purchaseOrder: template.purchaseOrder || '',
            validityAndTransportation: template.validityAndTransportation || '',
            general: template.general || ''
        };
        setTAndC(newTC);
        setSelectedTemplateId(template.id);
        onChangeJson(JSON.stringify(newTC));
    };

    const handleSelectTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        if (isNaN(id)) {
            setSelectedTemplateId('');
            return;
        }
        const template = templates.find(t => t.id === id);
        if (template) {
            applyTemplate(template);
        }
    };

    const handleTextChange = (field: keyof typeof tAndC, value: string) => {
        const newTC = { ...tAndC, [field]: value };
        setTAndC(newTC);
        onChangeJson(JSON.stringify(newTC));
    };

    const handleSaveNew = () => {
        setModalInputValue("");
        setModalConfig({
            isOpen: true,
            title: "Enter a name for this new Terms & Conditions template:",
            defaultValue: "",
            onConfirm: async (name: string) => {
                if (!name) return;
                try {
                    setLoading(true);
                    const created = await termsAndConditionsService.create({
                        name,
                        ...tAndC
                    });
                    await fetchTemplates();
                    setSelectedTemplateId(created.id);
                    setAlertMessage("Template saved successfully.");
                } catch (error) {
                    console.error(error);
                    setAlertMessage("Failed to save template.");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleUpdateExisting = () => {
        if (!selectedTemplateId) {
            setAlertMessage("No template selected to update.");
            return;
        }
        const template = templates.find(t => t.id === selectedTemplateId);
        
        setModalInputValue(template?.name || "");
        setModalConfig({
            isOpen: true,
            title: "Enter name to update this template:",
            defaultValue: template?.name || "",
            onConfirm: async (name: string) => {
                if (!name) return;
                try {
                    setLoading(true);
                    await termsAndConditionsService.update(selectedTemplateId as number, {
                        name,
                        ...tAndC
                    });
                    await fetchTemplates();
                    setAlertMessage("Template updated successfully.");
                } catch (error) {
                    console.error(error);
                    setAlertMessage("Failed to update template.");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleMakeDefault = async () => {
        if (!selectedTemplateId) {
            setAlertMessage("Please select or save a template first before making it default.");
            return;
        }
        try {
            setLoading(true);
            await termsAndConditionsService.setDefault(selectedTemplateId as number);
            await fetchTemplates();
            setAlertMessage("Template set as default successfully.");
        } catch (error) {
            console.error(error);
            setAlertMessage("Failed to set default template.");
        } finally {
            setLoading(false);
        }
    };

    // Removed nested AutoResizeTextarea

    return (
        <div className="border border-border rounded-lg bg-card p-4 sm:p-6 mb-8 mt-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-border">
                <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Terms and Conditions Creation</h2>
                    <p className="text-sm text-muted-foreground">Manage and inject custom Terms and Conditions for this quotation.</p>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2 items-center">
                    <div className="relative min-w-[200px] z-20" ref={dropdownRef}>
                        <div 
                            className={`p-2 border border-border rounded-md bg-background text-foreground text-sm flex justify-between items-center cursor-pointer min-w-[200px] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <span className="truncate max-w-[160px] select-none">
                                {selectedTemplateId 
                                    ? templates.find(t => t.id === selectedTemplateId)?.name + (templates.find(t => t.id === selectedTemplateId)?.isDefault ? ' (Default)' : '')
                                    : "-- Load Saved Template --"}
                            </span>
                            <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground flex-shrink-0" />
                        </div>
                        
                        {isDropdownOpen && (
                            <div className="absolute z-30 w-full mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
                                <div className="p-2 border-b border-border flex items-center bg-background">
                                    <Search className="w-4 h-4 text-muted-foreground mr-2" />
                                    <input 
                                        type="text" 
                                        placeholder="Search templates..."
                                        className="w-full bg-transparent text-sm outline-none text-foreground"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    <div 
                                        className="p-2 hover:bg-muted cursor-pointer text-sm text-foreground/80"
                                        onClick={() => {
                                            handleSelectTemplate({ target: { value: '' } } as any);
                                            setIsDropdownOpen(false);
                                            setSearchQuery("");
                                        }}
                                    >
                                        -- Clear Selection --
                                    </div>
                                    {templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                        <div className="p-3 text-center text-sm text-muted-foreground">No templates found</div>
                                    ) : (
                                        templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                                            <div 
                                                key={t.id}
                                                className={`p-2 hover:bg-muted cursor-pointer text-sm ${selectedTemplateId === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                                                onClick={() => {
                                                    handleSelectTemplate({ target: { value: String(t.id) } } as any);
                                                    setIsDropdownOpen(false);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                {t.name} {t.isDefault ? <span className="text-muted-foreground text-xs ml-1">(Default)</span> : ''}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSaveNew}
                            disabled={loading}
                            className="px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap font-medium"
                        >
                            Save as New
                        </button>
                        {selectedTemplateId && (
                            <button
                                type="button"
                                onClick={handleUpdateExisting}
                                disabled={loading}
                                className="px-3 py-2 bg-secondary text-foreground text-sm border border-border rounded-md hover:bg-secondary/80 transition-colors whitespace-nowrap"
                            >
                                Update Current
                            </button>
                        )}
                        {selectedTemplateId && (
                            <button
                                type="button"
                                onClick={handleMakeDefault}
                                disabled={loading}
                                className="px-3 py-2 bg-muted text-foreground text-sm border border-border rounded-md hover:bg-muted/80 transition-colors whitespace-nowrap"
                                title="Use this template automatically for new quotations"
                            >
                                Make Default
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <div>
                    <AutoResizeTextarea label="Payment & Tax" value={tAndC.paymentAndTax} onChange={(val) => handleTextChange('paymentAndTax', val)} />
                    <AutoResizeTextarea label="Warranty" value={tAndC.warranty} onChange={(val) => handleTextChange('warranty', val)} />
                    <AutoResizeTextarea label="Purchase Order" value={tAndC.purchaseOrder} onChange={(val) => handleTextChange('purchaseOrder', val)} />
                </div>
                <div>
                    <AutoResizeTextarea label="Delivery" value={tAndC.delivery} onChange={(val) => handleTextChange('delivery', val)} />
                    <AutoResizeTextarea label="Validity & Transportation" value={tAndC.validityAndTransportation} onChange={(val) => handleTextChange('validityAndTransportation', val)} />
                    <AutoResizeTextarea label="General" value={tAndC.general} onChange={(val) => handleTextChange('general', val)} />
                </div>
            </div>

            {/* Custom Modal for Prompts */}
            {modalConfig?.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setModalConfig(null)}>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-foreground mb-4">{modalConfig.title}</h3>
                        <input
                            type="text"
                            value={modalInputValue}
                            onChange={(e) => setModalInputValue(e.target.value)}
                            className="w-full p-3 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-6"
                            placeholder="Enter template name..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    modalConfig.onConfirm(modalInputValue);
                                    setModalConfig(null);
                                }
                            }}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setModalConfig(null)}
                                className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    modalConfig.onConfirm(modalInputValue);
                                    setModalConfig(null);
                                }}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow hover:bg-primary/90 transition-colors font-medium"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Modal */}
            {alertMessage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setAlertMessage(null)}>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-foreground mb-4">{alertMessage}</h3>
                        <div className="flex justify-center mt-6">
                            <button
                                type="button"
                                onClick={() => setAlertMessage(null)}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg shadow hover:bg-primary/90 transition-colors font-medium"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
