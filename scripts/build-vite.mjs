import { build } from "vite";

await build({
  root: process.cwd(),
  configFile: false,
  build: {
    rollupOptions: {
      input: "index.html"
    }
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787"
    }
  }
});
