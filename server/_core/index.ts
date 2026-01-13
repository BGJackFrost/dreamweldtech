import "dotenv/config";

// Initialize Sentry FIRST before any other imports
import { initSentry, sentryErrorHandler, captureError, captureMessage, getSentryStatus } from "../sentry";
initSentry();

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { securityHeaders, apiRateLimit, sanitizeMiddleware, securityLogger, checkBlockedIP, strictRateLimit, validateFileUpload, honeypotMiddleware } from "../security";
import { generateSitemap, generateRobotsTxt } from "../sitemap";
import { setupWebSocket } from "../websocket";
import { performHealthCheck, performSimpleHealthCheck, getServerMetrics } from "../healthCheck";
import { endpointMetricsMiddleware } from "../endpointMetrics";
import { 
  loginRateLimit, 
  passwordResetRateLimit, 
  contactFormRateLimit, 
  quoteRequestRateLimit,
  uploadRateLimit,
  searchRateLimit,
  apiRateLimitAdvanced,
  getRateLimitStats
} from "../advancedRateLimiter";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Security middleware
  app.use(checkBlockedIP);
  app.use(securityHeaders);
  app.use(sanitizeMiddleware);
  app.use(securityLogger);
  
  // Rate limiting for API routes (basic) - DISABLED temporarily
  // app.use("/api", apiRateLimit);
  
  // Advanced rate limiting for specific endpoints - DISABLED temporarily
  // app.use("/api/trpc/security.requestPasswordReset", passwordResetRateLimit);
  // app.use("/api/trpc/security.resetPassword", passwordResetRateLimit);
  // app.use("/api/trpc/contact.submit", contactFormRateLimit);
  // app.use("/api/trpc/quote.submit", quoteRequestRateLimit);
  // app.use("/api/trpc/search", searchRateLimit);
  // app.use("/api/upload", uploadRateLimit);
  
  // Endpoint metrics tracking
  app.use("/api", endpointMetricsMiddleware);
  
  // Stricter rate limit for sensitive endpoints - DISABLED temporarily
  // app.use("/api/oauth", strictRateLimit);
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Sitemap.xml endpoint
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      const sitemap = await generateSitemap();
      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.send(sitemap);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt endpoint
  app.get("/robots.txt", async (_req: Request, res: Response) => {
    try {
      const robots = await generateRobotsTxt();
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      res.send(robots);
    } catch (error) {
      console.error("Robots.txt generation error:", error);
      res.status(500).send("Error generating robots.txt");
    }
  });

  // Rate limit stats endpoint (admin only)
  app.get("/api/admin/rate-limit-stats", (req: Request, res: Response) => {
    try {
      const stats = getRateLimitStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get rate limit stats" });
    }
  });

  // File upload endpoint with enhanced security
  app.post("/api/upload", upload.single("file"), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      
      // Validate file with security checks
      const validation = validateFileUpload(file, {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: "all",
      });
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const timestamp = Date.now();
      // Sanitize filename more strictly
      const safeName = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/\.{2,}/g, ".") // Prevent directory traversal
        .substring(0, 100); // Limit filename length
      const key = `uploads/cv/${timestamp}-${safeName}`;

      const result = await storagePut(key, file.buffer, file.mimetype);
      res.json({ url: result.url, key: result.key });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });
  // ============================================
  // SENTRY TEST ENDPOINTS (Development/Testing only)
  // These endpoints are DISABLED in production
  // ============================================
  
  if (process.env.NODE_ENV === "development") {
    console.log("[Dev] Sentry test endpoints enabled at /api/test/sentry-*");
    
    // Test endpoint to trigger a captured error
    app.get("/api/test/sentry-error", (_req: Request, res: Response) => {
      try {
        // Intentionally throw an error to test Sentry
        throw new Error("[TEST] This is a test error to verify Sentry integration");
      } catch (error) {
        captureError(error as Error, {
          tags: { type: "test", source: "manual" },
          extra: { endpoint: "/api/test/sentry-error", timestamp: new Date().toISOString() }
        });
        res.json({ 
          success: true, 
          message: "Test error sent to Sentry",
          note: "Check your Sentry dashboard to verify the error was received"
        });
      }
    });

    // Test endpoint to trigger an unhandled error (caught by error handler)
    app.get("/api/test/sentry-unhandled", (_req: Request, _res: Response) => {
      // This will be caught by the global error handler and sent to Sentry
      throw new Error("[TEST] Unhandled error to test Sentry error handler");
    });

    // Test endpoint to send a custom message to Sentry
    app.get("/api/test/sentry-message", (_req: Request, res: Response) => {
      captureMessage("[TEST] Custom message from DreamWeldTech", "info", {
        tags: { type: "test", source: "manual" },
        extra: { endpoint: "/api/test/sentry-message", timestamp: new Date().toISOString() }
      });
      res.json({ 
        success: true, 
        message: "Test message sent to Sentry",
        note: "Check your Sentry dashboard to verify the message was received"
      });
    });

    // Get Sentry status
    app.get("/api/test/sentry-status", (_req: Request, res: Response) => {
      const status = getSentryStatus();
      res.json(status);
    });
  }

  // Public Health Check Endpoint (for UptimeRobot, Pingdom, etc.)
  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      const health = await performHealthCheck();
      const statusCode = health.status === 'healthy' ? 200 : 
                         health.status === 'degraded' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      console.error("Health check error:", error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Simple health check for load balancers (minimal response)
  app.get("/api/health/simple", async (_req: Request, res: Response) => {
    try {
      const health = await performSimpleHealthCheck();
      const statusCode = health.status === 'ok' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({ status: 'error', timestamp: new Date().toISOString() });
    }
  });

  // Server metrics endpoint
  app.get("/api/health/metrics", (_req: Request, res: Response) => {
    try {
      const metrics = getServerMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Setup WebSocket server for real-time notifications
  const wss = setupWebSocket(server);
  console.log('[WebSocket] Server initialized at /api/ws/notifications');

  // Sentry error handler (must be after all routes)
  app.use(sentryErrorHandler());
  
  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Server Error]", err);
    captureError(err);
    res.status(500).json({ error: "Internal server error" });
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`WebSocket server ready for connections`);
    console.log(`[Sentry] Error tracking enabled`);
    console.log(`[Rate Limiting] Advanced rate limiters active`);
  });
}

startServer().catch(console.error);
