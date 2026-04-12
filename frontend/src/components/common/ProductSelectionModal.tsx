import React, { useState, useEffect } from "react";
import { Search, Loader2, X } from "lucide-react";
import { productService } from "../../services/productService";
import { ProductDto } from "../../types/product";

interface ProductSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: ProductDto) => void;
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial fetch
    useEffect(() => {
        if (isOpen) {
            handleSearch(null);
        } else {
            setSearchQuery("");
            setProducts([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSearch = async (e: React.FormEvent | null) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const res = await productService.getAll(1, 50, searchQuery);
            // Handle both wrapped and unwrapped response formats
            const data = Array.isArray(res) ? res : Array.isArray((res as any).data) ? (res as any).data : [];
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border mt-10 overflow-hidden flex flex-col h-[85vh]">
                <div className="flex justify-between items-center p-4 border-b border-border/40 bg-secondary/20">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        Browse Products
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors text-muted-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-border/40 bg-background/50">
                    <form onSubmit={handleSearch} className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search catalog... (Press Enter to search)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            // Auto-fetch as they type with a short delay if they don't press enter
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearch(e);
                            }}
                            className="bg-background border border-border text-sm rounded-lg pl-9 pr-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                            autoFocus
                        />
                        <button type="submit" className="hidden">Search</button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto bg-card">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40 sticky top-0 z-10 backdrop-blur">
                            <tr>
                                <th className="px-6 py-4 font-medium">Item</th>
                                <th className="px-6 py-4 font-medium hidden sm:table-cell">Brand</th>
                                <th className="px-6 py-4 font-medium text-right">Price</th>
                                <th className="px-6 py-4 font-medium text-center w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        {searchQuery ? "No matching products found." : "Start searching to find a product..."}
                                    </td>
                                </tr>
                            ) : (
                                products.map((item) => (
                                    <tr key={item.id} className="hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => onSelect(item)}>
                                        <td className="px-6 py-3 font-medium text-foreground">
                                            <div className="flex flex-col">
                                                <span>{item.name}</span>
                                                <span className="text-xs text-muted-foreground mt-0.5 max-w-[400px] truncate">{item.itemCode || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-muted-foreground hidden sm:table-cell">
                                            {item.brand || "-"}
                                        </td>
                                        <td className="px-6 py-3 text-right font-medium text-primary">
                                            ${item.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                                                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors text-xs font-semibold"
                                            >
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
