import React from 'react';
import { ItemProcurementDto } from '../../services/itemProcurementService';
import { X, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface ItemProcurementDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    procurement: ItemProcurementDto;
}

export const ItemProcurementDetailsModal: React.FC<ItemProcurementDetailsModalProps> = ({
    isOpen,
    onClose,
    procurement
}) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col print:shadow-none print:w-full print:max-w-none print:h-auto print:max-h-none text-slate-900 overflow-hidden print:overflow-visible">
                {/* Header Actions - Hidden in Print */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 print:hidden shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">
                        Procurement Details
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-8 print:p-0 custom-scrollbar">
                    <div className="print-area max-w-3xl mx-auto space-y-8">
                        {/* Document Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
                                    Item Procurement
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    Generated on {format(new Date(), 'dd MMM yyyy')}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                    #{procurement.id.toString().padStart(4, '0')}
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Site Details</h3>
                                <p className="font-semibold text-slate-800 text-lg">{procurement.siteName}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</h3>
                                <p className="font-semibold text-slate-800 text-lg">
                                    {format(new Date(procurement.date), 'dd MMMM yyyy')}
                                </p>
                            </div>
                            {procurement.remarks && (
                                <div className="col-span-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</h3>
                                    <p className="text-slate-700">{procurement.remarks}</p>
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-blue-500 pl-3">
                                Procurement Items
                            </h3>
                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-700 text-sm border-b border-slate-200">
                                            <th className="p-3 w-16 font-bold">No.</th>
                                            <th className="p-3 font-bold">Item Name</th>
                                            <th className="p-3 w-32 font-bold">Quantity</th>
                                            <th className="p-3 font-bold">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {procurement.items.map((item, index) => (
                                            <tr key={index} className="bg-white">
                                                <td className="p-3 text-slate-500 font-medium">{index + 1}</td>
                                                <td className="p-3 text-slate-800 font-medium">{item.itemName}</td>
                                                <td className="p-3 text-slate-800">{item.quantity}</td>
                                                <td className="p-3 text-slate-600">{item.remarks || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer Signatures */}
                        <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8">
                            <div>
                                <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
                                <p className="text-sm font-bold text-slate-800">Prepared By</p>
                                <p className="text-sm text-slate-500">{procurement.createdByUserName || 'System User'}</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
                                <p className="text-sm font-bold text-slate-800">Approved By</p>
                                <p className="text-sm text-slate-500">Site Manager / Director</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
