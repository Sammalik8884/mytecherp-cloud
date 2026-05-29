import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { dprService } from "../services/dprService";
import { Loader2 } from "lucide-react";

export const DprPrintView = () => {
    const { id } = useParams<{ id: string }>();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReport = async () => {
            try {
                if (!id) return;
                const searchParams = new URLSearchParams(window.location.search);
                const siteId = searchParams.get('siteId');
                
                if (!siteId) {
                    setError("Site ID missing in URL");
                    return;
                }

                const allReports = await dprService.getBySiteId(Number(siteId));
                const found = allReports.find((r: any) => r.id === Number(id));
                if (found) {
                    setReport(found);
                } else {
                    setError("Report not found");
                }
            } catch (err: any) {
                setError(err.message || "Failed to load report");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [id]);

    useEffect(() => {
        // Automatically trigger print dialog when data is loaded
        if (report && !loading) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [report, loading]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <div className="text-center text-red-500 text-xl font-bold">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen text-black p-8 font-sans print:p-0">
            <div className="max-w-4xl mx-auto border border-gray-300 p-8 print:border-none print:p-0">
                <div className="text-center mb-8 border-b pb-4">
                    <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Daily Progress Report</h1>
                    <p className="text-gray-600">Project: <span className="font-semibold text-black">{report.siteName || `Site ID: ${report.siteId}`}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm">
                    <div><span className="font-semibold">Date:</span> {new Date(report.date).toLocaleDateString()}</div>
                    <div><span className="font-semibold">Site In-charge:</span> {report.siteInCharge}</div>
                    <div><span className="font-semibold">Site Opening Time:</span> {report.siteOpeningTime}</div>
                    <div><span className="font-semibold">Site Closing Time:</span> {report.siteClosingTime}</div>
                    <div><span className="font-semibold">Total Workers:</span> {report.totalWorkers}</div>
                    <div className="col-span-2"><span className="font-semibold">Next Day Activity Plan:</span> {report.nextDayActivityPlan || 'N/A'}</div>
                </div>

                {report.activities && report.activities.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-3 bg-gray-100 p-2">Activities</h2>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                            {report.activities.map((act: any, i: number) => (
                                <li key={i}>{act.activityName || act}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {report.employees && report.employees.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-3 bg-gray-100 p-2">Employees</h2>
                        <table className="w-full text-sm border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-300 p-2 text-left">Name</th>
                                    <th className="border border-gray-300 p-2 text-center">In Time</th>
                                    <th className="border border-gray-300 p-2 text-center">Out Time</th>
                                    <th className="border border-gray-300 p-2 text-center">Over Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.employees.map((emp: any, i: number) => (
                                    <tr key={i}>
                                        <td className="border border-gray-300 p-2">{emp.employeeName}</td>
                                        <td className="border border-gray-300 p-2 text-center">{emp.inTime || '-'}</td>
                                        <td className="border border-gray-300 p-2 text-center">{emp.outTime || '-'}</td>
                                        <td className="border border-gray-300 p-2 text-center">{emp.overTime || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {report.materials && report.materials.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-3 bg-gray-100 p-2">Materials</h2>
                        <table className="w-full text-sm border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-300 p-2 text-left">Item</th>
                                    <th className="border border-gray-300 p-2 text-center">Quantity</th>
                                    <th className="border border-gray-300 p-2 text-left">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.materials.map((mat: any, i: number) => (
                                    <tr key={i}>
                                        <td className="border border-gray-300 p-2">{mat.item}</td>
                                        <td className="border border-gray-300 p-2 text-center">{mat.quantity}</td>
                                        <td className="border border-gray-300 p-2">{mat.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-16 flex justify-between text-sm">
                    <div className="text-center">
                        <div className="w-48 border-b border-black mb-2"></div>
                        <p>Prepared By</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b border-black mb-2"></div>
                        <p>Approved By</p>
                    </div>
                </div>
            </div>
            
            <div className="fixed bottom-4 right-4 print:hidden">
                <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg font-semibold hover:bg-blue-700"
                >
                    Print Report
                </button>
            </div>
        </div>
    );
};
