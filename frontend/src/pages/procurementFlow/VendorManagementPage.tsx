import React, { useEffect, useState } from 'react';
import { vendorService, VendorDto } from '../../services/vendorService';
import { Plus, Edit, Trash2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const VendorManagementPage: React.FC = () => {
    const [vendors, setVendors] = useState<VendorDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<VendorDto | null>(null);
    const [formData, setFormData] = useState<Partial<VendorDto>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await vendorService.getAll();
            setVendors(data);
        } catch (error) {
            console.error('Failed to load vendors', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this vendor?')) return;
        try {
            await vendorService.delete(id);
            setVendors(vendors.filter(v => v.id !== id));
            toast.success('Vendor deleted successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete vendor.');
        }
    };

    const openModal = (vendor?: VendorDto) => {
        if (vendor) {
            setEditingVendor(vendor);
            setFormData(vendor);
        } else {
            setEditingVendor(null);
            setFormData({ vendorName: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingVendor(null);
        setFormData({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vendorName) {
            toast.error('Vendor Name is required');
            return;
        }

        try {
            if (editingVendor) {
                await vendorService.update(editingVendor.id, formData);
                toast.success('Vendor updated successfully');
            } else {
                await vendorService.create(formData);
                toast.success('Vendor created successfully');
            }
            closeModal();
            loadData();
        } catch (error) {
            console.error(error);
            toast.error(editingVendor ? 'Failed to update vendor' : 'Failed to create vendor');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Vendors Database</h1>
                <button 
                    onClick={() => openModal()}
                    className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Vendor</span>
                </button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 font-medium">Vendor Name</th>
                            <th className="px-6 py-3 font-medium">City</th>
                            <th className="px-6 py-3 font-medium">Contact Person</th>
                            <th className="px-6 py-3 font-medium">Contact Number</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {vendors.map((v) => (
                            <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 font-medium">{v.vendorName}</td>
                                <td className="px-6 py-4">{v.cityName || '-'}</td>
                                <td className="px-6 py-4">{v.contactPerson || '-'}</td>
                                <td className="px-6 py-4">{v.contactNumber || '-'}</td>
                                <td className="px-6 py-4 text-right flex justify-end space-x-2">
                                    <button 
                                        onClick={() => openModal(v)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(v.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {vendors.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    No vendors found. They will appear here once quotes are submitted or manually added.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card w-full max-w-lg rounded-lg shadow-lg flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h2>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vendor Name <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.vendorName || ''}
                                        onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">City</label>
                                        <input 
                                            type="text" 
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.cityName || ''}
                                            onChange={(e) => setFormData({...formData, cityName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Contact Person</label>
                                        <input 
                                            type="text" 
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.contactPerson || ''}
                                            onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Contact Number</label>
                                    <input 
                                        type="text" 
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.contactNumber || ''}
                                        onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                                    />
                                </div>
                                <div className="border-t border-border pt-4 mt-4">
                                    <h3 className="text-sm font-semibold mb-3">Bank Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Bank Name</label>
                                            <input 
                                                type="text" 
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={formData.bankName || ''}
                                                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Account Name</label>
                                                <input 
                                                    type="text" 
                                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    value={formData.bankAccountName || ''}
                                                    onChange={(e) => setFormData({...formData, bankAccountName: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Account Number</label>
                                                <input 
                                                    type="text" 
                                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    value={formData.accountNumber || ''}
                                                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-border flex justify-end space-x-3 bg-muted/30">
                                <button 
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorManagementPage;
