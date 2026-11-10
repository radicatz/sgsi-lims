import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the web app calls /api on its own origin; Vite forwards it to the API (no CORS, no keys in the browser).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:4000" } },
});
