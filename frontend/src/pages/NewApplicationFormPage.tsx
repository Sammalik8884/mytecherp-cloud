import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationFormApi } from '../api/applicationFormApi';
import { Send, ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const NewApplicationFormPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        applicantName: '',
        designation: '',
        employeeCode: '',
        phoneNumber: '',
        employeeType: '',
        subject: '',
        description: ''
    });

    const [attachments, setAttachments] = useState<File[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments([...attachments, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.applicantName || !formData.designation || !formData.phoneNumber || !formData.employeeType || !formData.subject || !formData.description) {
            toast.error("Please fill all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key as keyof typeof formData]);
            });

            attachments.forEach(file => {
                data.append('Attachments', file);
            });

            await applicationFormApi.create(data);
            toast.success("Application form submitted successfully!");
            navigate('/application-forms');
        } catch (error) {
            toast.error("Failed to submit application form.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
                <button
                    onClick={() => navigate('/application-forms')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">New Application Form</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Applicant Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name <span className="text-red-500">*</span></label>
                            <input type="text" name="applicantName" required value={formData.applicantName} onChange={handleChange} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation <span className="text-red-500">*</span></label>
                            <input type="text" name="designation" required value={formData.designation} onChange={handleChange} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                            <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type <span className="text-red-500">*</span></label>
                            <select name="employeeType" required value={formData.employeeType} onChange={handleChange} className="input">
                                <option value="">Select Type</option>
                                <option value="Permanent">Permanent</option>
                                <option value="Contract">Contract</option>
                                <option value="Probation">Probation</option>
                                <option value="Intern">Intern</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code (Optional)</label>
                            <input type="text" name="employeeCode" value={formData.employeeCode} onChange={handleChange} className="input" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Application Details</h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                            <input type="text" name="subject" required value={formData.subject} onChange={handleChange} className="input" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                            <textarea 
                                name="description" 
                                required 
                                value={formData.description} 
                                onChange={handleChange} 
                                className="input min-h-[200px]" 
                                placeholder="Write your application here..."
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Attachments (Optional)</h2>
                        <label className="cursor-pointer text-primary hover:text-primary/80 flex items-center font-medium text-sm">
                            <Plus className="h-4 w-4 mr-1" /> Add Files
                            <input type="file" multiple onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>

                    {attachments.length > 0 ? (
                        <ul className="space-y-2">
                            {attachments.map((file, idx) => (
                                <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm font-medium truncate">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700 p-1">
                                        <X className="h-4 w-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-6 text-gray-500 text-sm">
                            No files attached. Click "Add Files" to attach documents.
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary px-8">
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                </div>
            </form>
        </div>
    );
};
