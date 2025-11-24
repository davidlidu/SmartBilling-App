import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/facturador/', // Important for deploying to a subfolder
  build: {
    chunkSizeWarningLimit: 600, // Optional: slightly increase limit if needed after splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Example: Create a vendor chunk for large dependencies
          if (id.includes('node_modules')) {
            // Further refine: e.g., put react and react-dom in their own chunk
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react')) {
              return 'vendor-react';
            }
            // Catch-all for other node_modules, or be more specific
            return 'vendor'; 
          }
        }
      }
    }
  }
})
