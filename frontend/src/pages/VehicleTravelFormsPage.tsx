import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Car, FileText, Calendar, Eye, Download, X } from 'lucide-react';
import { vehicleTravelFormApi, VehicleTravelFormDto } from '../api/vehicleTravelFormApi';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';

export const VehicleTravelFormsPage: React.FC = () => {
    const [forms, setForms] = useState<VehicleTravelFormDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedForm, setSelectedForm] = useState<VehicleTravelFormDto | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = async () => {
        try {
            const data = await vehicleTravelFormApi.getAll();
            setForms(data);
        } catch (error) {
            console.error("Failed to load vehicle travel forms:", error);
            toast.error("Failed to load forms");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await vehicleTravelFormApi.approve(id);
            toast.success("Form approved successfully");
            loadForms();
            if (selectedForm && selectedForm.id === id) {
                setSelectedForm(null);
            }
        } catch (error) {
            console.error("Failed to approve form:", error);
            toast.error("Failed to approve form");
        }
    };

    const handleDownloadAttachment = (fileUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', fileName);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    };

    const filteredForms = forms.filter(form => 
        form.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vehicle Travel Ledger</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and track daily vehicle readings</p>
                </div>
                <button 
                    onClick={() => navigate('/vehicle-travel-forms/new')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Entry
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by employee, vehicle or reg no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Info</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (km)</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredForms.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <Car className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-base font-medium">No readings found</p>
                                            <p className="text-sm mt-1">There are no vehicle travel records to display.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredForms.map((form) => {
                                    const distance = Math.max(0, form.endReading - form.startReading).toFixed(2);
                                    return (
                                        <tr key={form.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    {new Date(form.currentDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{form.employeeName}</div>
                                                <div className="text-sm text-gray-500">ID: {form.employeeId}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{form.vehicleName}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-0.5">{form.registrationNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    {distance} km
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {form.status === 'Approved' ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Approved
                                                    </span>
                                                ) : form.status === 'PendingMunawar' ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Pending Munawar
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Pending Shahbaz
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {((user?.email?.toLowerCase() === 'shahbaz.ali@mytecheng.com' && (!form.status || form.status === 'Pending')) || 
                                                  (user?.email?.toLowerCase() === 'munawar.hasan@mytecheng.com' && form.status === 'PendingMunawar')) && (
                                                    <button
                                                        onClick={() => handleApprove(form.id)}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center mr-2"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedForm(form)}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center inline-flex"
                                                >
                                                    <Eye className="w-4 h-4 mr-1.5" />
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal using Portal to avoid header overlaps */}
            {selectedForm && createPortal(
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedForm(null);
                }}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="text-xl leading-6 font-bold text-gray-900 flex items-center" id="modal-title">
                                <Car className="w-6 h-6 mr-2 text-indigo-600" />
                                Vehicle Travel Details
                            </h3>
                            <button onClick={() => setSelectedForm(null)} className="text-gray-400 hover:text-gray-500 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">

                                        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100 mb-6">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Employee Name</p>
                                                <p className="mt-1 text-base text-gray-900 font-semibold">{selectedForm.employeeName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Employee ID</p>
                                                <p className="mt-1 text-base text-gray-900 font-mono">{selectedForm.employeeId}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Contact</p>
                                                <p className="mt-1 text-base text-gray-900">{selectedForm.contact}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Date</p>
                                                <p className="mt-1 text-base text-gray-900">{selectedForm.currentDate ? new Date(selectedForm.currentDate).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Vehicle</p>
                                                <p className="mt-1 text-base text-gray-900">{selectedForm.vehicleName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Registration No</p>
                                                <p className="mt-1 text-base text-gray-900 font-mono">{selectedForm.registrationNumber}</p>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-6">
                                            <h4 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-4">Reading Ledger</h4>
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-50">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Start Reading</p>
                                                    <p className="text-lg font-mono font-semibold text-gray-900">{selectedForm.startReading?.toLocaleString() ?? '0'}</p>
                                                </div>
                                                <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-50">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">End Reading</p>
                                                    <p className="text-lg font-mono font-semibold text-gray-900">{selectedForm.endReading?.toLocaleString() ?? '0'}</p>
                                                </div>
                                                <div className="bg-indigo-600 p-4 rounded-lg shadow-sm">
                                                    <p className="text-xs font-medium text-indigo-100 mb-1">Distance (km)</p>
                                                    <p className="text-lg font-bold text-white">{((selectedForm.endReading || 0) - (selectedForm.startReading || 0)).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedForm.attachments && selectedForm.attachments.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                                    <FileText className="w-4 h-4 mr-1.5" />
                                                    Attachments
                                                </h4>
                                                <ul className="space-y-2">
                                                    {selectedForm.attachments.map((attachment) => (
                                                        <li key={attachment.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 transition-colors">
                                                            <div className="flex items-center">
                                                                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                                                                <span className="text-sm font-medium text-gray-700">{attachment.fileName}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDownloadAttachment(attachment.fileUrl, attachment.fileName)}
                                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center text-xs font-medium"
                                                            >
                                                                <Download className="w-4 h-4 mr-1" /> Download
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                        </div>
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                                onClick={() => setSelectedForm(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
