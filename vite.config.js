import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      // El bundle principal ya pasa de 2 MiB (límite por defecto del precaché).
      // Sin esto, "vite build" falla en el paso del service worker.
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },

      manifest: {
        name: "Finanzas Alianzito",
        short_name: "Alianzito",
        description: "Aplicación educativa de Finanzas Alianzito",

        theme_color: "#0057B8",
        background_color: "#ffffff",

        display: "standalone",
        start_url: "/",

        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});