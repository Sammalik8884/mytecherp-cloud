import { FileSignature, Plus } from "lucide-react";
import { ProjectScopeModal } from "../components/common/ProjectScopeModal";

export const ProjectDocumentsPage = () => {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-card border border-border rounded-xl p-6 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Project Documents</h1>
                    <p className="text-muted-foreground">Select a document type to create and fill out the form.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Project Scope Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Project Scope' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">Project Scope</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the project scope document and link it to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>
                {/* Project Drawings IFC Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Project Drawings IFC' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">Project Drawings IFC</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the project drawings document and link it to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* Future Document Cards can be added here */}
                <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border border-dashed border-border rounded-xl text-muted-foreground">
                    <p className="text-sm">More document types coming soon...</p>
                </div>
            </div>

            <ProjectScopeModal />
        </div>
    );
};
