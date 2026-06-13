import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ArrowLeft, Send, FileText, User, Briefcase, Phone, Hash } from 'lucide-react';
import { applicationFormApi } from '../api/applicationFormApi';
import toast from 'react-hot-toast';

export const NewApplicationFormPage: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    
    const [formData, setFormData] = useState({
        applicantName: '',
        designation: '',
        applicationDate: new Date().toISOString().split('T')[0],
        employeeCode: '',
        phoneNumber: '',
        employeeType: '',
        subject: '',
        description: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                data.append(key, value);
            });

            attachments.forEach(file => {
                data.append('Attachments', file);
            });

            await applicationFormApi.create(data);
            toast.success("Application form submitted successfully!");
            navigate('/application-forms');
        } catch (error: any) {
            console.error("Submission error:", error);
            const bodyStr = typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data;
            const errorMsg = error.response?.data?.title || error.response?.data?.Error || error.response?.data?.error || bodyStr || error.message || "Failed to submit application form.";
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => navigate('/application-forms')}
                        className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Application</h1>
                        <p className="text-sm text-gray-500">Submit a new application for approval</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Applicant Information Box */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md duration-300">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-indigo-900 flex items-center">
                                <User className="w-5 h-5 mr-2 text-indigo-600" />
                                Applicant Information
                            </h2>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Applicant Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input type="text" name="applicantName" required value={formData.applicantName} onChange={handleChange} className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" placeholder="John Doe" />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Designation <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Briefcase className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input type="text" name="designation" required value={formData.designation} onChange={handleChange} className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" placeholder="Software Engineer" />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" placeholder="+1 (555) 000-0000" />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Employee Type <span className="text-red-500">*</span></label>
                                <select name="employeeType" required value={formData.employeeType} onChange={handleChange} className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200">
                                    <option value="">Select Type</option>
                                    <option value="Permanent">Permanent</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Probation">Probation</option>
                                    <option value="Intern">Intern</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Employee Code <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input type="text" name="employeeCode" value={formData.employeeCode} onChange={handleChange} className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200" placeholder="EMP-1234" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Application Details Box */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md duration-300">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-emerald-900 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-emerald-600" />
                                Application Details
                            </h2>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
                                <input type="text" name="subject" required value={formData.subject} onChange={handleChange} className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" placeholder="Enter application subject..." />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                                <textarea 
                                    name="description" 
                                    required 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    className="block w-full min-h-[240px] rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 resize-y" 
                                    placeholder="Write your detailed application here..."
                                />
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
                            className="group relative flex items-center justify-center px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden shadow-md hover:shadow-lg"
                        >
                            <span className="relative z-10 flex items-center">
                                <Send className={`h-4 w-4 mr-2 ${isSubmitting ? 'animate-pulse' : 'group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200'}`} />
                                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
