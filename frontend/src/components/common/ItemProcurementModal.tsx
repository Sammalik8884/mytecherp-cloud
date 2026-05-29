import React, { useState, useEffect } from 'react';
import { SiteDto } from '../../types/crm';
import { CreateItemProcurementDto, CreateItemProcurementItemDto, ItemProcurementDto } from '../../services/itemProcurementService';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ItemProcurementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateItemProcurementDto) => Promise<void>;
    sites: SiteDto[];
    initialData?: ItemProcurementDto | null;
}

export const ItemProcurementModal: React.FC<ItemProcurementModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    sites,
    initialData
}) => {
    const [siteId, setSiteId] = useState<number | ''>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState<string>('');
    const [items, setItems] = useState<CreateItemProcurementItemDto[]>([{ itemName: '', quantity: 1, remarks: '' }]);
    const [rowCount, setRowCount] = useState<number | ''>('');

    useEffect(() => {
        if (initialData) {
            setSiteId(initialData.siteId);
            setDate(initialData.date.split('T')[0]);
            setRemarks(initialData.remarks || '');
            setItems(initialData.items.map(i => ({
                itemName: i.itemName,
                quantity: i.quantity,
                remarks: i.remarks || ''
            })));
        } else {
            setSiteId('');
            setDate(new Date().toISOString().split('T')[0]);
            setRemarks('');
            setItems([{ itemName: '', quantity: 1, remarks: '' }]);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleAddRows = () => {
        if (typeof rowCount === 'number' && rowCount > 0) {
            const newRows = Array.from({ length: rowCount }).map(() => ({
                itemName: '',
                quantity: 1,
                remarks: ''
            }));
            setItems(prev => [...prev, ...newRows]);
            setRowCount('');
        }
    };

    const handleItemChange = (index: number, field: keyof CreateItemProcurementItemDto, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!siteId) {
            toast.error("Please select a site");
            return;
        }

        if (items.some(i => !i.itemName.trim() || i.quantity <= 0)) {
            toast.error("Please fill all item names and ensure quantity is greater than 0");
            return;
        }

        try {
            await onSubmit({
                siteId: Number(siteId),
                date,
                remarks,
                items
            });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save Item Procurement");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? 'Edit Item Procurement' : 'New Item Procurement'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form id="procurement-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Select Site *
                                </label>
                                <select
                                    value={siteId}
                                    onChange={(e) => setSiteId(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    required
                                >
                                    <option value="">Select a site...</option>
                                    {sites.map(site => (
                                        <option key={site.id} value={site.id}>{site.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Overall Remarks
                                </label>
                                <input
                                    type="text"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    placeholder="Any general remarks..."
                                />
                            </div>
                        </div>

                        <div className="border-t border-slate-800 pt-6">
                            <div className="flex items-end gap-4 mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white">Procurement Items</h3>
                                    <p className="text-sm text-slate-400">Add items to be procured</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rowCount}
                                        onChange={(e) => setRowCount(e.target.value ? Number(e.target.value) : '')}
                                        placeholder="No. of rows"
                                        className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddRows}
                                        className="px-4 py-2 bg-slate-800 text-blue-400 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-800 border-b border-slate-700 text-slate-300 text-sm">
                                            <th className="p-3 w-16">No.</th>
                                            <th className="p-3">Item Name *</th>
                                            <th className="p-3 w-32">Quantity *</th>
                                            <th className="p-3">Remarks</th>
                                            <th className="p-3 w-16 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="p-3 text-slate-400">{index + 1}</td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={item.itemName}
                                                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                        placeholder="Item name"
                                                        required
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                        required
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={item.remarks}
                                                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                        placeholder="Remarks"
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        disabled={items.length === 1}
                                                        className="text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-4 h-4 mx-auto" />
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

                <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-xl flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all border border-transparent hover:border-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="procurement-form"
                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        {initialData ? 'Update Procurement' : 'Save Procurement'}
                    </button>
                </div>
            </div>
        </div>
    );
};
