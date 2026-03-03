import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || env.VITE_BACKEND_URL || '';

  let proxyOrigin: string | null = null;
  if (apiBaseUrl) {
    try {
      proxyOrigin = new URL(apiBaseUrl).origin;
    } catch {
      proxyOrigin = null;
    }
  }

  return {
    plugins: [react()],
    server: proxyOrigin
      ? {
        proxy: {
          '/api/v1': {
            target: proxyOrigin,
            changeOrigin: true,
            secure: false,
          },
          '/sanctum': {
            target: proxyOrigin,
            changeOrigin: true,
            secure: false,
          },
        },
      }
      : undefined,
  };
})
