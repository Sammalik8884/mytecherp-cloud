import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { applicationFormApi, ApplicationFormDto } from '../api/applicationFormApi';
import { Plus, Eye, CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ApplicationFormsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [forms, setForms] = useState<ApplicationFormDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedForm, setSelectedForm] = useState<ApplicationFormDto | null>(null);
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isDirector = user?.email?.toLowerCase() === 'shahbaz.ali@mytecheng.com';
    const isCeo = user?.email?.toLowerCase() === 'munawar.hasan@mytecheng.com';

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = async () => {
        try {
            const data = await applicationFormApi.getAll();
            setForms(data);
        } catch (error) {
            toast.error('Failed to load application forms');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status: string) => {
        if (!selectedForm) return;
        setIsSubmitting(true);
        try {
            await applicationFormApi.updateStatus(selectedForm.id, { status, remarks });
            toast.success(`Application ${status}`);
            setSelectedForm(null);
            setRemarks('');
            loadForms();
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canApprove = (form: ApplicationFormDto) => {
        if (isDirector && form.status === 'Pending') return true;
        if (isCeo && form.status === 'Approved by Director') return true;
        return false;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Approved by Director': return 'bg-blue-100 text-blue-800';
            case 'Approved by CEO': return 'bg-green-100 text-green-800';
            case 'Your application is rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FileText className="mr-3 h-6 w-6 text-primary" />
                    Application Forms
                </h1>
                <button
                    onClick={() => navigate('/application-forms/new')}
                    className="flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Application
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : forms.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
                    No application forms found.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {forms.map((form) => (
                                    <tr key={form.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{form.applicantName}</div>
                                            <div className="text-sm text-gray-500">{form.designation}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(form.applicationDate), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                            {form.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(form.status)}`}>
                                                {form.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedForm(form)}
                                                className="text-primary hover:text-primary/80 flex items-center justify-end w-full"
                                            >
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {selectedForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                            <button onClick={() => setSelectedForm(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Applicant Name</label>
                                    <div className="font-medium">{selectedForm.applicantName}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Designation</label>
                                    <div className="font-medium">{selectedForm.designation}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Employee Code</label>
                                    <div className="font-medium">{selectedForm.employeeCode || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Phone Number</label>
                                    <div className="font-medium">{selectedForm.phoneNumber}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Employee Type</label>
                                    <div className="font-medium">{selectedForm.employeeType}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Date</label>
                                    <div className="font-medium">{format(new Date(selectedForm.applicationDate), 'MMM d, yyyy')}</div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Subject</label>
                                <div className="p-3 bg-gray-50 rounded-lg font-medium border border-gray-200">{selectedForm.subject}</div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Description</label>
                                <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap border border-gray-200">{selectedForm.description}</div>
                            </div>

                            {selectedForm.attachments && selectedForm.attachments.length > 0 && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold mb-2 block">Attachments</label>
                                    <div className="space-y-2">
                                        {selectedForm.attachments.map(att => (
                                            <a 
                                                key={att.id} 
                                                href={att.fileUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                                            >
                                                <FileText className="h-5 w-5 text-gray-400 mr-3 group-hover:text-primary" />
                                                <span className="flex-1 text-sm font-medium">{att.fileName}</span>
                                                <Download className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedForm.directorRemarks || selectedForm.ceoRemarks || selectedForm.rejectionRemarks) && (
                                <div className="space-y-3 mt-6 border-t pt-4">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Remarks</label>
                                    {selectedForm.directorRemarks && (
                                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm">
                                            <span className="font-bold text-blue-800 block mb-1">Director:</span>
                                            {selectedForm.directorRemarks}
                                        </div>
                                    )}
                                    {selectedForm.ceoRemarks && (
                                        <div className="bg-green-50 border border-green-100 p-3 rounded-lg text-sm">
                                            <span className="font-bold text-green-800 block mb-1">CEO:</span>
                                            {selectedForm.ceoRemarks}
                                        </div>
                                    )}
                                    {selectedForm.rejectionRemarks && (
                                        <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-sm">
                                            <span className="font-bold text-red-800 block mb-1">Rejection Remarks:</span>
                                            {selectedForm.rejectionRemarks}
                                        </div>
                                    )}
                                </div>
                            )}

                            {canApprove(selectedForm) && (
                                <div className="mt-6 border-t border-gray-100 pt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Add Remarks (Required for rejection, optional for approval)
                                    </label>
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm mb-4"
                                        placeholder="Enter your remarks here..."
                                    />
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            disabled={isSubmitting || !remarks.trim()}
                                            onClick={() => handleStatusUpdate('Your application is rejected')}
                                            className="flex items-center px-4 py-2 bg-white text-red-600 border border-gray-300 font-medium rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                        </button>
                                        <button
                                            disabled={isSubmitting}
                                            onClick={() => handleStatusUpdate(isDirector ? 'Approved by Director' : 'Approved by CEO')}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
