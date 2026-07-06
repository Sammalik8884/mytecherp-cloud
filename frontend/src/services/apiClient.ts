import axios from "axios";
import toast from "react-hot-toast";

// Create Axios Instance
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5269/api", // Supports local or deployed URL
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("token");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // If sending FormData, remove the default Content-Type so axios
        // can auto-set multipart/form-data with the correct boundary
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Unauthorized errors and auto-refresh token
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 400) {
            const data = error.response.data;
            if (data && data.errors) {
                // It's a standard .NET validation error response
                const errorMessages = Object.values(data.errors).flat().join('\n');
                if (errorMessages) {
                    toast.error(errorMessages);
                } else if (data.title) {
                    toast.error(data.title);
                }
            } else if (typeof data === "string") {
                toast.error(data);
            } else if (data && data.message) {
                toast.error(data.message);
            }
        }

        // Do not intercept login failures
        if (originalRequest.url?.includes("/Auth/")) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Attempt silent auto-refresh
            const savedCredsStr = sessionStorage.getItem("erp_creds");
            if (savedCredsStr) {
                try {
                    const creds = JSON.parse(atob(savedCredsStr));
                    // Call backend login to get a fresh token without user intervention
                    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5269/api";
                    const res = await axios.post(`${apiUrl}/Auth/login`, creds, { timeout: 5000 });

                    if (res.data?.token) {
                        sessionStorage.setItem("token", res.data.token);
                        originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
                        // Retry the original failed request with the new token
                        return apiClient(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh failed, proceed to logout
                }
            }

            // Clear token and force logout
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("erp_creds");

            // Only redirect if we are not already on the login page
            // Otherwise, we destroy the local error state the React component is trying to show.
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
