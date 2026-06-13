import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { officeApi, OfficeDto } from "../api/officeApi";
import { Building2, MapPin, ChevronRight, Plus } from "lucide-react";

export const OfficesListPage = () => {
    const [offices, setOffices] = useState<OfficeDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOffices();
    }, []);

    const loadOffices = async () => {
        try {
            const data = await officeApi.getAll();
            setOffices(data);
        } catch (error) {
            console.error("Failed to load offices", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading offices...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Offices Directory</h1>
                    <p className="text-muted-foreground">View and manage all company offices and administrative centers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offices.map((office) => (
                    <Link key={office.id} to={`/offices/${office.id}`} className="block">
                        <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:border-primary/50 group">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{office.name}</h3>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {office.city || "No City specified"}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    </Link>
                ))}
                
                <div className="bg-muted/20 border border-dashed border-border rounded-xl p-5 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[140px]" onClick={() => alert("Add Office dialog to be implemented if needed")}>
                    <div className="p-3 bg-background rounded-full shadow-sm mb-3">
                        <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Add Custom Office</span>
                </div>
            </div>
        </div>
    );
};
