import React, { useState, useEffect, useRef } from 'react';
import { TermsAndConditionsTemplate, termsAndConditionsService } from '../services/termsAndConditionsService';

interface Props {
    valueJson: string | undefined;
    onChangeJson: (json: string) => void;
}

export const TermsAndConditionsSection: React.FC<Props> = ({ valueJson, onChangeJson }) => {
    const [templates, setTemplates] = useState<TermsAndConditionsTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

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

    const handleSaveNew = async () => {
        const name = prompt("Enter a name for this new Terms & Conditions template:");
        if (!name) return;

        try {
            setLoading(true);
            const created = await termsAndConditionsService.create({
                name,
                ...tAndC
            });
            await fetchTemplates();
            setSelectedTemplateId(created.id);
            alert("Template saved successfully.");
        } catch (error) {
            console.error(error);
            alert("Failed to save template.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateExisting = async () => {
        if (!selectedTemplateId) {
            alert("No template selected to update.");
            return;
        }
        const template = templates.find(t => t.id === selectedTemplateId);
        const name = prompt("Enter name to update this template:", template?.name);
        if (!name) return;

        try {
            setLoading(true);
            await termsAndConditionsService.update(selectedTemplateId as number, {
                name,
                ...tAndC
            });
            await fetchTemplates();
            alert("Template updated successfully.");
        } catch (error) {
            console.error(error);
            alert("Failed to update template.");
        } finally {
            setLoading(false);
        }
    };

    const handleMakeDefault = async () => {
        if (!selectedTemplateId) {
            alert("Please select or save a template first before making it default.");
            return;
        }
        try {
            setLoading(true);
            await termsAndConditionsService.setDefault(selectedTemplateId as number);
            await fetchTemplates();
            alert("Template set as default successfully.");
        } catch (error) {
            console.error(error);
            alert("Failed to set default template.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-resizing textarea wrapper
    const AutoResizeTextarea = ({ label, field }: { label: string, field: keyof typeof tAndC }) => {
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
        }, [tAndC[field]]);

        return (
            <div className="flex flex-col space-y-1 mb-4">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <textarea
                    ref={textareaRef}
                    value={tAndC[field]}
                    onChange={(e) => {
                        handleTextChange(field, e.target.value);
                        adjustHeight();
                    }}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none overflow-hidden resize-none min-h-[60px]"
                    placeholder={`Enter ${label} details...`}
                    rows={1}
                />
            </div>
        );
    };

    return (
        <div className="border border-border rounded-lg bg-card p-4 sm:p-6 mb-8 mt-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-border">
                <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Terms and Conditions Creation</h2>
                    <p className="text-sm text-muted-foreground">Manage and inject custom Terms and Conditions for this quotation.</p>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2 items-center">
                    <select
                        value={selectedTemplateId}
                        onChange={handleSelectTemplate}
                        className="p-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[200px]"
                        disabled={loading}
                    >
                        <option value="">-- Load Saved Template --</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name} {t.isDefault ? '(Default)' : ''}
                            </option>
                        ))}
                    </select>

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
                    <AutoResizeTextarea label="Payment & Tax" field="paymentAndTax" />
                    <AutoResizeTextarea label="Warranty" field="warranty" />
                    <AutoResizeTextarea label="Purchase Order" field="purchaseOrder" />
                </div>
                <div>
                    <AutoResizeTextarea label="Delivery" field="delivery" />
                    <AutoResizeTextarea label="Validity & Transportation" field="validityAndTransportation" />
                    <AutoResizeTextarea label="General" field="general" />
                </div>
            </div>
        </div>
    );
};
