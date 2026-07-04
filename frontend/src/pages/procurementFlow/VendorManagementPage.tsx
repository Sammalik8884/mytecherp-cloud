import React, { useEffect, useState } from 'react';
import { vendorService, VendorDto } from '../../services/vendorService';
import { Plus, Edit, Trash2 } from 'lucide-react';

const VendorManagementPage: React.FC = () => {
    const [vendors, setVendors] = useState<VendorDto[]>([]);
    const [loading, setLoading] = useState(true);

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
        } catch (error) {
            console.error(error);
            alert('Failed to delete vendor.');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Vendors Database</h1>
                {/* Normally we might have a create modal here, but for now we focus on the list as upsert handles creation mostly */}
                <button 
                    onClick={() => alert('Creating vendors manually is pending UI implementation. Usually auto-upserted.')}
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
                                        onClick={() => alert('Edit modal pending UI implementation')}
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
                                    No vendors found. They will appear here once quotes are submitted.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VendorManagementPage;
