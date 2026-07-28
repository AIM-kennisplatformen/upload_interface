import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Not 8000: kp-typedb's docker-compose service in this project family
    // permanently publishes TypeDB's own HTTP API on that port too.
    proxy: {
      "/document": "http://localhost:8001",
      "/field": "http://localhost:8001",
    },
  },
});
