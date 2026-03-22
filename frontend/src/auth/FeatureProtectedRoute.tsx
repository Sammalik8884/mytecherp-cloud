import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { PlanFeature } from "../types/auth";
import { toast } from "react-hot-toast";
import { useEffect } from "react";

interface FeatureProtectedRouteProps {
    requiredFeature: PlanFeature;
    redirectPath?: string;
}

export const FeatureProtectedRoute = ({ requiredFeature, redirectPath = "/subscription/plans" }: FeatureProtectedRouteProps) => {
    const { hasFeature, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && !hasFeature(requiredFeature)) {
            toast.error("This feature requires a Pro subscription. Please upgrade to unlock.");
        }
    }, [isAuthenticated, hasFeature, requiredFeature]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!hasFeature(requiredFeature)) {
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
};
