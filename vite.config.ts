import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Check if Sentry source maps upload should be enabled
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || "dreamweldtech";
const ENABLE_SENTRY_SOURCEMAPS = SENTRY_AUTH_TOKEN && SENTRY_ORG && process.env.NODE_ENV === "production";

const plugins = [react(), tailwindcss(), vitePluginManusRuntime()];

// Add Sentry plugin only in production with proper credentials
if (ENABLE_SENTRY_SOURCEMAPS) {
  plugins.push(
    sentryVitePlugin({
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
      authToken: SENTRY_AUTH_TOKEN,
      
      // Source maps configuration
      sourcemaps: {
        // Upload source maps to Sentry
        filesToDeleteAfterUpload: ["./dist/public/**/*.map"],
      },
      
      // Release configuration
      release: {
        name: `dreamweldtech@${process.env.npm_package_version || "1.0.0"}`,
        // Automatically set commits
        setCommits: {
          auto: true,
          ignoreMissing: true,
        },
      },
      
      // Telemetry
      telemetry: false,
    })
  );
  console.log("[Sentry] Source maps upload enabled");
} else if (process.env.NODE_ENV === "production") {
  console.log("[Sentry] Source maps upload disabled - missing SENTRY_AUTH_TOKEN or SENTRY_ORG");
}

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
    // Enable source maps for Sentry
    sourcemap: true,
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'vendor-react': ['react', 'react-dom', 'react-helmet-async'],
          // Router
          'vendor-router': ['wouter'],
          // State management and data fetching
          'vendor-query': ['@tanstack/react-query', '@trpc/client', '@trpc/react-query'],
          // UI components library
          'vendor-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          // Charts and visualization
          'vendor-charts': ['recharts'],
          // Icons
          'vendor-icons': ['lucide-react'],
          // Form handling
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Date utilities
          'vendor-date': ['date-fns'],
          // Utilities
          'vendor-utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    // Increase chunk size warning limit (optional)
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
