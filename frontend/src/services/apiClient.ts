import axios from "axios";

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

        // Do not intercept login failures
        if (originalRequest.url?.includes("/Auth/login")) {
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
                    const res = await axios.post(`${apiUrl}/Auth/login`, creds);

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
