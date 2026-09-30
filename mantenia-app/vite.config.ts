import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // `npm run dev:https` levanta con certificado local: el celular necesita HTTPS para usar la cámara.
    plugins: [react(), tailwindcss(), ...(mode === "https" ? [basicSsl()] : [])],
    server: {
      host: true, // accesible desde el celular en la misma red
      port: 5173,
      proxy: {
        // En desarrollo /api se reenvía a la API .NET: no hace falta configurar CORS.
        "/api": { target: env.VITE_API_PROXY || "http://localhost:5080", changeOrigin: true },
      },
    },
  };
});
