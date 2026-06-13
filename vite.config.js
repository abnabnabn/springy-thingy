import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    },
    // Optionally increase the warning limit to avoid the warning entirely,
    // since Three.js is inherently large even when chunked.
    chunkSizeWarningLimit: 1000 
  }
});
