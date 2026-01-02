/**
 * Vite optimization configuration for Phase 2
 * Code splitting, PWA, Image optimization
 */

export const optimizationConfig = {
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-query': ['@tanstack/react-query', '@trpc/client', '@trpc/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'date-fns', 'nanoid'],
          
          // Feature chunks
          'admin-layout': [
            '/src/components/AdminLayout.tsx',
            '/src/components/AdminThemeProvider.tsx',
          ],
          'admin-dashboard': [
            '/src/pages/admin/Dashboard.tsx',
            '/src/components/AdvancedAnalytics.tsx',
          ],
          'admin-products': [
            '/src/pages/admin/Products.tsx',
            '/src/pages/admin/ProductForm.tsx',
          ],
          'admin-news': [
            '/src/pages/admin/News.tsx',
            '/src/pages/admin/NewsForm.tsx',
          ],
          'admin-contacts': [
            '/src/pages/admin/Contacts.tsx',
          ],
          'admin-activity': [
            '/src/pages/admin/ActivityLog.tsx',
            '/src/pages/admin/NotificationCenter.tsx',
            '/src/pages/admin/PermissionMatrix.tsx',
          ],
          
          // Page chunks
          'page-home': ['/src/pages/Home.tsx'],
          'page-products': ['/src/pages/Products.tsx'],
          'page-about': ['/src/pages/About.tsx'],
          'page-news': ['/src/pages/News.tsx'],
          'page-careers': ['/src/pages/Careers.tsx'],
          'page-contact': ['/src/pages/Contact.tsx'],
        },
      },
    },
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Target
    target: 'esnext',
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // Source maps for production (optional)
    sourcemap: false,
  },

  // Optimization hints
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@trpc/client',
      'recharts',
      'framer-motion',
    ],
    exclude: ['@vite/client'],
  },
};

export default optimizationConfig;
