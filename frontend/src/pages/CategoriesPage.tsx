import { useState, useEffect } from "react";
import { FolderTree, Plus, Edit, Trash2, Loader2, Search } from "lucide-react";
import { categoryService } from "../services/categoryService";
import { CategoryDto, CreateCategoryDto } from "../types/category";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/common/ConfirmModal";

export const CategoriesPage = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info'|'warning'|'danger'; onConfirm: () => void }>({ isOpen: false, title: "", message: "", type: "info", onConfirm: () => {} });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
    const [formData, setFormData] = useState<CreateCategoryDto>({
        name: "",
        description: ""
    });

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error) {
            toast.error("Failed to load categories.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (category?: CategoryDto) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || ""
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: "", description: "" });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (editingCategory) {
                await categoryService.update(editingCategory.id, formData);
                toast.success("Category updated successfully");
            } else {
                await categoryService.create(formData);
                toast.success("Category created successfully");
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Error saving category");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Category",
            message: "Are you sure you want to delete this category? Products linked to this category may prevent deletion.",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await categoryService.delete(id);
                    toast.success("Category deleted successfully");
                    fetchCategories();
                } catch (error) {
                    toast.error("Failed to delete category. You might be unauthorized, or it may be linked to existing products.");
                }
            }
        });
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Categories</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Organize your products and services into folders.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add Category</span>
                </button>
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 border-b border-border/40 flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium">Category Name</th>
                                <th className="px-6 py-4 font-medium">Description</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                    </td>
                                </tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                                        No categories found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category) => (
                                    <tr key={category.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground flex items-center space-x-2">
                                            <FolderTree className="h-4 w-4 text-primary/70" />
                                            <span>{category.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {category.description || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(category)}
                                                    className="p-2 border border-primary/30 text-primary hover:bg-primary/20 hover:text-primary rounded-lg transition-colors flex items-center space-x-1 font-medium bg-primary/10"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span className="text-xs">Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="p-2 border border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors flex items-center space-x-1 font-medium bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="text-xs">Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />

                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                                <FolderTree className="h-5 w-5 text-primary" />
                                <span>{editingCategory ? "Edit Category" : "Add New Category"}</span>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category Name *</label>
                                    <input
                                        type="text" required
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        placeholder="e.g. HVAC, Fire Safety, Plumbing"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-border/50">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium hover:bg-secondary/50 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:-translate-y-0.5 transition-transform flex items-center space-x-2"
                                    >
                                        {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        <span>Save Category</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};
