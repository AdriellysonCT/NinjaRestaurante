import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  server: {
    proxy: {
      '/nano-bridge': {
        target: 'https://ais-pre-vvqwyuzthph2a5tmg5zz72-68614801731.us-west2.run.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/nano-bridge/, '')
      }
    }
  },
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: []
  }
})
