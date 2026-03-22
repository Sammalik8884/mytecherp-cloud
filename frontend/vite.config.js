import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from "path";
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        {
            name: 'html-rewrite',
            configureServer: function (server) {
                server.middlewares.use(function (req, res, next) {
                    if (req.url === '/landing' || req.url === '/landing/') {
                        req.url = '/landing.html';
                    }
                    if (req.url === '/privacy' || req.url === '/privacy/') {
                        req.url = '/privacy.html';
                    }
                    if (req.url === '/terms' || req.url === '/terms/') {
                        req.url = '/terms.html';
                    }
                    next();
                });
            }
        }
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        }
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5269', // Fixed proxy to correct .NET port
                changeOrigin: true,
                secure: false,
            }
        }
    }
});
