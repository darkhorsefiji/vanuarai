import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: proxy API calls to the Express/Neon backend on :3000.
// strictPort: own 5173 and fail loudly if it's taken, rather than silently
// bumping onto another project's port (the cross-project port-stealing bug).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": "http://localhost:3000" },
  },
});
