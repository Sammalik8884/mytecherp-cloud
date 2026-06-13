import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ArrowLeft, Send, Save, Car, Hash, FileText, User, Phone, MapPin } from 'lucide-react';
import { vehicleTravelFormApi } from '../api/vehicleTravelFormApi';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';

export const NewVehicleTravelFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    
    const [formData, setFormData] = useState({
        employeeName: '',
        employeeId: '',
        contact: '',
        vehicleName: '',
        registrationNumber: '',
        startReading: '',
        endReading: '',
        currentDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        // Initialize from local storage or user context
        const savedData = localStorage.getItem('vehicleTravelFormInfo');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({
                    ...prev,
                    employeeName: parsed.employeeName || user?.fullName || '',
                    employeeId: parsed.employeeId || '0000',
                    contact: parsed.contact || '',
                    vehicleName: parsed.vehicleName || '',
                    registrationNumber: parsed.registrationNumber || ''
                }));
            } catch (e) {
                console.error("Failed to parse saved vehicle info", e);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                employeeName: user?.fullName || '',
                employeeId: '0000'
            }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveInfo = () => {
        const infoToSave = {
            employeeName: formData.employeeName,
            employeeId: formData.employeeId,
            contact: formData.contact,
            vehicleName: formData.vehicleName,
            registrationNumber: formData.registrationNumber
        };
        localStorage.setItem('vehicleTravelFormInfo', JSON.stringify(infoToSave));
        toast.success("Static information saved! It will auto-fill next time.");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, String(value));
            });

            attachments.forEach(file => {
                data.append('Attachments', file);
            });

            await vehicleTravelFormApi.create(data as any);
            
            // Auto-save the static info silently on successful submission
            handleSaveInfo();
            
            toast.success("Vehicle travel form submitted successfully!");
            navigate('/vehicle-travel-forms');
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.response?.data?.title || error.message || "Failed to submit vehicle travel form.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => navigate('/vehicle-travel-forms')}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors duration-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Vehicle Travel Form</h1>
                        <p className="text-sm text-gray-500 mt-1">Submit your daily vehicle readings</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Employee Information Box */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md duration-300">
                    <div className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50/50 p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-indigo-900 flex items-center">
                            <User className="w-5 h-5 mr-2 text-indigo-600" />
                            Employee Information
                        </h2>
                        <button 
                            type="button" 
                            onClick={handleSaveInfo}
                            className="flex items-center text-sm px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-lg shadow-sm hover:bg-indigo-50 transition-colors"
                        >
                            <Save className="w-4 h-4 mr-1.5" />
                            Save Info
                        </button>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Employee Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input type="text" name="employeeName" required value={formData.employeeName} onChange={handleChange} className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" placeholder="John Doe" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Employee ID <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input type="text" name="employeeId" required value={formData.employeeId} onChange={handleChange} className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" placeholder="0000" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Contact <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input type="text" name="contact" required value={formData.contact} onChange={handleChange} className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" placeholder="+1234567890" />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input type="date" disabled value={formData.currentDate} className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-100 text-gray-500 px-4 py-3 text-sm cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vehicle & Reading Details Box */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md duration-300">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-emerald-900 flex items-center">
                            <Car className="w-5 h-5 mr-2 text-emerald-600" />
                            Vehicle & Readings
                        </h2>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Vehicle Name <span className="text-red-500">*</span></label>
                                <input type="text" name="vehicleName" required value={formData.vehicleName} onChange={handleChange} className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" placeholder="Toyota Corolla" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Registration Number <span className="text-red-500">*</span></label>
                                <input type="text" name="registrationNumber" required value={formData.registrationNumber} onChange={handleChange} className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" placeholder="ABC-1234" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Start Reading (km) <span className="text-red-500">*</span></label>
                                <input type="number" step="0.01" name="startReading" required value={formData.startReading} onChange={handleChange} className="block w-full rounded-xl border-gray-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" placeholder="e.g. 45000" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">End Reading (km) <span className="text-red-500">*</span></label>
                                <input type="number" step="0.01" name="endReading" required value={formData.endReading} onChange={handleChange} className="block w-full rounded-xl border-gray-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" placeholder="e.g. 45050" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attachments Box */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md duration-300">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Attachments <span className="text-gray-400 font-normal text-sm ml-1">(Optional)</span></h2>
                        <label className="cursor-pointer group flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm hover:bg-indigo-100 transition-colors">
                            <Plus className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" /> 
                            Browse Files
                            <input type="file" multiple onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>

                    <div className="p-8">
                        {attachments.length > 0 ? (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {attachments.map((file, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <FileText className="h-4 w-4 text-indigo-500" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                                        </div>
                                        <button type="button" onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                                <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                                    <Plus className="h-full w-full" />
                                </div>
                                <p className="text-sm text-gray-500">No files attached. Click "Browse Files" to attach documents.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex justify-end pt-4 pb-12">
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className={`flex items-center px-8 py-3.5 rounded-xl text-white font-medium shadow-sm transition-all duration-200 ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5'}`}
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        ) : (
                            <Send className="w-5 h-5 mr-2" />
                        )}
                        Submit Readings
                    </button>
                </div>
            </form>
        </div>
    );
};
