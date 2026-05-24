import { createServer } from "vite";

const server = await createServer({
  root: process.cwd(),
  configFile: false,
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787"
    }
  }
});

await server.listen();
server.printUrls();
