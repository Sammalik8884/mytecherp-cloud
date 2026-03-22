import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface RoleProtectedRouteProps {
    allowedRoles: string[];
}

export const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
    const { isAuthenticated, hasRole } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!hasRole(allowedRoles)) {
        return <Navigate to="/" replace />; // Redirect unauthorized users to dashboard
    }

    return <Outlet />;
};
