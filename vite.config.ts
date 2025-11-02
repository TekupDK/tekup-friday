import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

const replacePlaceholdersPlugin = () => ({
  name: "html-placeholder-replacer",
  transformIndexHtml(html: string) {
    const env = process.env;
    const title = env.VITE_APP_TITLE || "Friday AI Chat";
    const logo = env.VITE_APP_LOGO || "/logo.png";
    const analyticsEndpoint = env.VITE_ANALYTICS_ENDPOINT || "";
    const analyticsWebsiteId = env.VITE_ANALYTICS_WEBSITE_ID || "";

    let out = html
      .replace(/%VITE_APP_TITLE%/g, title)
      .replace(/%VITE_APP_LOGO%/g, logo)
      .replace(/%VITE_ANALYTICS_ENDPOINT%/g, analyticsEndpoint)
      .replace(/%VITE_ANALYTICS_WEBSITE_ID%/g, analyticsWebsiteId);

    // If analytics variables are not provided, remove any umami analytics script tag
    if (!analyticsEndpoint || !analyticsWebsiteId) {
      out = out.replace(/\n?\s*<script[^>]*umami[^>]*><\/script>\s*/gi, "\n");
    }
    return out;
  },
});

const plugins = [react(), tailwindcss(), jsxLocPlugin(), replacePlaceholdersPlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
