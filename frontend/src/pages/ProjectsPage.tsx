import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { siteService } from "../services/siteService";
import { SiteDto } from "../types/site";
import { FolderTree, MapPin, Building2, ChevronRight } from "lucide-react";

export const ProjectsPage = () => {
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSites();
    }, []);

    const loadSites = async () => {
        try {
            const data = await siteService.getAll();
            setSites(data);
        } catch (error) {
            console.error("Failed to load sites", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading projects...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Projects Directory</h1>
                    <p className="text-muted-foreground">View and manage all sites and related activities.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sites.map((site) => (
                    <Link key={site.id} to={`/projects/${site.id}`} className="block">
                        <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:border-primary/50 group">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                                        <FolderTree className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{site.name}</h3>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {site.city || "No City specified"}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                                <div className="flex items-center text-muted-foreground">
                                    <Building2 className="h-4 w-4 mr-1.5" />
                                    {site.customerName || "No Client Assigned"}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
                {sites.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                        <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No projects found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
