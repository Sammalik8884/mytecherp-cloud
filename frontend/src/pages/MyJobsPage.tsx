import { useState, useEffect } from "react";
import { Loader2, Wrench, MapPin, CalendarClock, ChevronRight } from "lucide-react";
import { workOrderService } from "../services/workOrderService";
import { timeTrackingService } from "../services/timeTrackingService";
import { WorkOrderDto } from "../types/field";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const MyJobsPage = () => {
    const [jobs, setJobs] = useState<WorkOrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkInLoadingId, setCheckInLoadingId] = useState<number | null>(null);
    const navigate = useNavigate();

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const data = await workOrderService.getMyJobs();
            setJobs(data);
        } catch (error) {
            toast.error("Failed to load your assigned jobs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleCheckIn = async (e: React.MouseEvent, workOrderId: number) => {
        e.stopPropagation();
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setCheckInLoadingId(workOrderId);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await timeTrackingService.checkIn({
                        workOrderId,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                    toast.success("Checked in successfully!");
                    navigate(`/job/${workOrderId}`);
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to check in.");
                } finally {
                    setCheckInLoadingId(null);
                }
            },
            (err) => {
                toast.error("Failed to acquire GPS location: " + err.message);
                setCheckInLoadingId(null);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const activeJobs = jobs.filter(j => j.status !== 'Completed' && j.status !== 'Approved');
    const pastJobs = jobs.filter(j => j.status === 'Completed' || j.status === 'Approved');

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-2">
                    <Wrench className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    My Jobs
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">Your field service schedule.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Active Jobs */}
                    <div>
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">Action Required</h2>
                        {activeJobs.length === 0 ? (
                            <div className="bg-secondary/30 border border-border/50 rounded-2xl p-8 text-center text-muted-foreground">
                                No active jobs assigned. Enjoy your day!
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {activeJobs.map(job => (
                                    <div
                                        key={job.id}
                                        onClick={() => navigate(`/job/${job.id}`)}
                                        className="bg-secondary/40 border border-primary/20 hover:border-primary/50 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all cursor-pointer group active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">
                                                    WO-{job.id.toString().padStart(4, '0')}
                                                </span>
                                                <span className="text-xs font-medium text-primary">
                                                    {job.status}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>

                                        <h3 className="font-semibold text-lg text-foreground mb-1 leading-tight">{job.description}</h3>

                                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-3">
                                            <div className="space-y-2 text-sm text-muted-foreground flex-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 shrink-0" />
                                                    <span className="truncate">{job.customerName} - {job.siteName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CalendarClock className="h-4 w-4 shrink-0" />
                                                    <span>{new Date(job.scheduledDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                </div>
                                            </div>

                                            {job.status === 'Initialized' && !job.checkInTime ? (
                                                <button
                                                    onClick={(e) => handleCheckIn(e, job.id)}
                                                    disabled={checkInLoadingId === job.id}
                                                    className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                                >
                                                    {checkInLoadingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                                    Check In & Start Job
                                                </button>
                                            ) : (job.status === 'InProgress' || job.status === 'Initialized') ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/job/${job.id}`); }}
                                                    className="w-full sm:w-auto px-4 py-2 border border-primary text-primary hover:bg-primary/10 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    Continue Job
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Jobs */}
                    {pastJobs.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">Completed</h2>
                            <div className="grid gap-3 opacity-75">
                                {pastJobs.map(job => (
                                    <div
                                        key={job.id}
                                        onClick={() => navigate(`/job/${job.id}`)}
                                        className="bg-card border border-border/50 rounded-xl p-4 shadow-sm cursor-pointer hover:bg-secondary/40 transition-colors"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-medium text-foreground text-sm line-clamp-1">{job.description}</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">{job.customerName}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                    {job.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
