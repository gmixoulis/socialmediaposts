import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // All /api/* requests are forwarded to the Express backend
      "/api": {
        target: process.env.VITE_API_URL || "http://backend1:5000",
        changeOrigin: true,
      },
    },
  },
})

