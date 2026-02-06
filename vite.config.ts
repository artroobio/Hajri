import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            proxy: {
                '/api/openai': {
                    target: 'https://api.openai.com/v1',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/openai/, ''),
                    configure: (proxy, _options) => {
                        proxy.on('proxyReq', (proxyReq, _req, _res) => {
                            // Inject OpenAI API key from environment variables
                            const apiKey = env.VITE_OPENAI_API_KEY;
                            if (apiKey) {
                                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
                            }
                        });
                    }
                }
            }
        }
    }
})
