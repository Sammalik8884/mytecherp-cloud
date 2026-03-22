import { useState, useEffect } from "react";
import { Package, Plus, Edit, Trash2, Loader2, Search, ImageIcon, UploadCloud, AlertTriangle } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { apiClient } from "../services/apiClient";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { ProductDto, CreateProductDto } from "../types/product";
import { CategoryDto } from "../types/category";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/common/ConfirmModal";

export const ProductsPage = () => {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [lowStockCount, setLowStockCount] = useState<number>(0);

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info'|'warning'|'danger'; onConfirm: () => void }>({ isOpen: false, title: "", message: "", type: "info", onConfirm: () => {} });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
    const [formData, setFormData] = useState<CreateProductDto>({
        name: "",
        price: 0,
        categoryId: 0,
        description: "",
        brand: "",
        itemCode: ""
    });

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importBrand, setImportBrand] = useState("LIFECO");
    const [importLoading, setImportLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsData, categoriesData, metricsData] = await Promise.all([
                productService.getAll(page, 50, searchQuery), // Paged, 50 per page
                categoryService.getAll(),
                apiClient.get('/Dashboard/metrics').then(r => r.data).catch(() => null)
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
            if (metricsData) setLowStockCount(metricsData.lowStockItems || 0);
        } catch (error) {
            toast.error("Failed to load products.");
        } finally {
            setLoading(false);
        }
    };

    // Debounced search logic could be added here, for now it filters API strictly on Enter or Blur
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]); // Re-fetch on page change

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchData();
    };

    const handleOpenModal = (product?: ProductDto) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price,
                priceAED: product.priceAED || 0,
                categoryId: product.categoryId,
                description: product.description || "",
                brand: product.brand || "",
                itemCode: product.itemCode || ""
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                price: 0,
                categoryId: categories.length > 0 ? categories[0].id : 0,
                description: "",
                brand: "",
                itemCode: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, image: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.categoryId === 0) {
            toast.error("Please select a valid category.");
            return;
        }

        setFormLoading(true);
        try {
            if (editingProduct) {
                await productService.update(editingProduct.id, formData);
                toast.success("Product updated successfully");
            } else {
                await productService.create(formData);
                toast.success("Product created successfully");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Error saving product");
        } finally {
            setFormLoading(false);
        }
    };

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            toast.error("Please select an Excel file.");
            return;
        }

        setImportLoading(true);
        try {
            const res = await productService.importExcel(importFile, importBrand);
            toast.success(res.message || "Import completed successfully");
            setIsImportModalOpen(false);
            setImportFile(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Error importing products");
        } finally {
            setImportLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Product",
            message: "Are you sure you want to delete this product? This action cannot be undone.",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await productService.delete(id);
                    toast.success("Product deleted successfully");
                    fetchData();
                } catch (error) {
                    toast.error("Failed to delete product. Access denied.");
                }
            }
        });
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Products & Services</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage your catalog of items and services.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-lg font-medium hover:bg-secondary/50 transition-all shadow-sm flex items-center space-x-2"
                    >
                        <UploadCloud className="h-5 w-5" />
                        <span>Import Excel</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 flex items-center space-x-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Item</span>
                    </button>
                </div>
            </div>

            <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Items Loaded"
                    value={products.length}
                    subtitle="Currently displayed page"
                    icon={Package}
                    href="#"
                    accentColor="indigo"
                />
                <StatCard
                    title="Low Stock Warning"
                    value={lowStockCount}
                    subtitle="Items below reorder limit"
                    icon={AlertTriangle}
                    href="#"
                    accentColor="rose"
                    trend={lowStockCount > 0 ? 'down' : 'neutral'}
                    trendLabel={lowStockCount > 0 ? "Needs reorder" : "Stock healthy"}
                />
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 border-b border-border/40 flex justify-between items-center">
                    <form onSubmit={handleSearch} className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search catalog... (Press Enter)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium pl-6">Item</th>
                                <th className="px-6 py-4 font-medium">Category</th>
                                <th className="px-6 py-4 font-medium">Brand</th>
                                <th className="px-6 py-4 font-medium text-right">Price</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        No items found.
                                    </td>
                                </tr>
                            ) : (
                                products.map((item) => (
                                    <tr key={item.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-8 w-8 rounded bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                                    {item.imageUrl ? (
                                                        <img src={`http://localhost:5269/${item.imageUrl}`} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span>{item.name}</span>
                                                    <span className="text-xs text-muted-foreground">{item.itemCode || "-"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.category?.name || "Uncategorized"}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.brand || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-primary">
                                            ${item.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-2 border border-primary/30 text-primary hover:bg-primary/20 hover:text-primary rounded-lg transition-colors flex items-center space-x-1 font-medium bg-primary/10"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span className="text-xs">Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
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

                <div className="p-4 border-t border-border/40 flex justify-between items-center text-sm text-muted-foreground">
                    <div>Showing page {page}</div>
                    <div className="space-x-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 rounded bg-background border border-border disabled:opacity-50 hover:bg-secondary/50"
                        >
                            Previous
                        </button>
                        <button
                            disabled={products.length < 50}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 rounded bg-background border border-border disabled:opacity-50 hover:bg-secondary/50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-secondary border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent pointer-events-none" />

                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                                <Package className="h-5 w-5 text-primary" />
                                <span>{editingProduct ? "Edit Item" : "Add New Item"}</span>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Item Name *</label>
                                        <input
                                            type="text" required
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category *</label>
                                        <select
                                            required
                                            value={formData.categoryId}
                                            onChange={e => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary appearance-none"
                                        >
                                            <option value={0} disabled>Select...</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Price ($) *</label>
                                        <input
                                            type="number" step="0.01" required min="0"
                                            value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Item Code / SKU</label>
                                        <input
                                            type="text"
                                            value={formData.itemCode} onChange={e => setFormData({ ...formData, itemCode: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Brand</label>
                                    <input
                                        type="text"
                                        value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
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

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Item Image (Optional)</label>
                                    <label className="w-full border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-lg flex items-center justify-center p-4 cursor-pointer">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        <div className="flex flex-col items-center space-y-1 text-muted-foreground group">
                                            <ImageIcon className="h-6 w-6 group-hover:text-primary transition-colors" />
                                            <span className="text-xs font-medium">{formData.image ? formData.image.name : "Click to upload an image"}</span>
                                        </div>
                                    </label>
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
                                        <span>Save Item</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Import Excel Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-secondary to-accent pointer-events-none" />

                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                                <UploadCloud className="h-5 w-5 text-accent" />
                                <span>Import from Excel</span>
                            </h2>

                            <form onSubmit={handleImportSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Brand (Optional default)</label>
                                    <input
                                        type="text"
                                        value={importBrand} onChange={e => setImportBrand(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Select Excel File (.xlsx, .xls)</label>
                                    <input
                                        type="file" required accept=".xlsx,.xls"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-border/50">
                                    <button
                                        type="button"
                                        onClick={() => { setIsImportModalOpen(false); setImportFile(null); }}
                                        className="px-4 py-2 text-sm font-medium hover:bg-secondary/50 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={importLoading}
                                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:-translate-y-0.5 transition-transform flex items-center space-x-2 shadow-lg hover:shadow-primary/25"
                                    >
                                        {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        <span>Upload & Import</span>
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
