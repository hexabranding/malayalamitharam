import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  publicDir: "assets",
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          aos: ["aos"],
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://api.malayalamitharam.in",
        changeOrigin: true,
        secure: true,
      },
      "/uploads": {
        target: "https://api.malayalamitharam.in",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
