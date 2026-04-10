import { useState, useEffect } from "react";
import { Users, Plus, Shield, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { authService } from "../services/authService";
import { toast } from "react-hot-toast";

export const UsersPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        role: ""
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                authService.getUsers(),
                authService.getRoles()
            ]);
            setUsers(usersData);
            // Only show the official backend roles — filter out stale DB entries like Worker, Client, Customers
            const validRoles = ["Manager", "Engineer", "Technician", "Customer", "Salesman", "Estimation"];
            const filteredRoles = rolesData.filter((r: string) => validRoles.includes(r));
            setRoles(filteredRoles);
            if (filteredRoles.length > 0) {
                setFormData(prev => ({ ...prev, role: filteredRoles[0] }));
            }
        } catch (error) {
            toast.error("Failed to load users or roles. You may not have permission.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = () => {
        setFormData({
            fullName: "",
            email: "",
            password: "",
            role: roles.length > 0 ? roles[0] : ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const res = await authService.createUser(formData);
            toast.success(res.message || "User created successfully");
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            const status = error.response?.status;
            const data = error.response?.data;
            if (status === 403) {
                toast.error("You don't have permission to create users. Please log out and back in.");
            } else if (status === 401) {
                toast.error("Your session has expired. Please log in again.");
            } else {
                const msg = data?.error || data?.Error || data?.message || data?.Message ||
                            (Array.isArray(data?.errors) ? data.errors.join(", ") : null) ||
                            error.message || "Error creating user. Check the password meets complexity requirements.";
                toast.error(msg);
            }
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Users & Roles</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage access and roles for your organization.</p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Invite User</span>
                </button>
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Role(s)</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-border flex items-center justify-center shrink-0">
                                                    <span className="font-bold text-primary">{user.fullName?.charAt(0) || 'U'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{user.fullName || "Unnamed User"}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center mt-0.5">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {(user.roles || []).map((role: string) => (
                                                    <span key={role} className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                        <Shield className="h-3 w-3" />
                                                        <span>{role}</span>
                                                    </span>
                                                ))}
                                                {(!user.roles || user.roles.length === 0) && <span className="text-muted-foreground italic text-xs">No roles assigned</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.isActive ? (
                                                <span className="inline-flex items-center space-x-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-md text-xs font-medium">
                                                    <CheckCircle className="h-3 w-3" />
                                                    <span>Active</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center space-x-1 text-red-400 bg-red-400/10 px-2 py-1 rounded-md text-xs font-medium">
                                                    <XCircle className="h-3 w-3" />
                                                    <span>Inactive</span>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent pointer-events-none" />

                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                                <Users className="h-5 w-5 text-primary" />
                                <span>Invite New User</span>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name *</label>
                                    <input
                                        type="text" required
                                        value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email Address *</label>
                                    <input
                                        type="email" required
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Temporary Password *</label>
                                    <input
                                        type="password" required minLength={6}
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        placeholder="Min 6 chars, 1 uppercase, 1 symbol"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Password must contain an uppercase letter, lowercase letter, number, and special character.
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Assign Role *</label>
                                    <select
                                        required
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    >
                                        <option value="" disabled>Select a role...</option>
                                        {roles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
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
                                        <span>Create User</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
