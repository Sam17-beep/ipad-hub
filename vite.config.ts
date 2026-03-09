import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/ipad-hub/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "iPad Hub",
        short_name: "Hub",
        description: "Productivity hub for iPad",
        start_url: "/ipad-hub/",
        scope: "/ipad-hub/",
        theme_color: "#0f0f0f",
        background_color: "#0f0f0f",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
});
