import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/chat": {
        target: "http://localhost:5678",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/chat/,
            "/webhook/d83e4c1a-5b60-4432-bd71-e1a4aa3a434f/chat"
          ),
      },
    },
  },
});
