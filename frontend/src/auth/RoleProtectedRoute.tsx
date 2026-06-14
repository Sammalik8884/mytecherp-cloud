import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface RoleProtectedRouteProps {
    allowedRoles: string[];
    allowedEmails?: string[];
}

export const RoleProtectedRoute = ({ allowedRoles, allowedEmails }: RoleProtectedRouteProps) => {
    const { isAuthenticated, hasRole, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const isEmailAllowed = allowedEmails && user?.email && allowedEmails.includes(user.email.toLowerCase());
    const isRoleAllowed = hasRole(allowedRoles);

    if (!isRoleAllowed && !isEmailAllowed) {
        return <Navigate to="/" replace />; // Redirect unauthorized users to dashboard
    }

    return <Outlet />;
};
