import * as Sentry from "@sentry/node";
import { Request, Response, NextFunction } from "express";

// ============================================
// SENTRY CONFIGURATION
// ============================================

const SENTRY_DSN = process.env.SENTRY_DSN || "";
const ENVIRONMENT = process.env.NODE_ENV || "development";
const RELEASE = process.env.npm_package_version || "1.0.0";

// Initialize Sentry
export function initSentry() {
  if (!SENTRY_DSN) {
    console.log("[Sentry] DSN not configured, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `dreamweldtech@${RELEASE}`,
    
    // Performance monitoring
    tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,
    

    // Integrations
    integrations: [
      // HTTP integration for tracking outgoing requests
      Sentry.httpIntegration(),
      // Express integration
      Sentry.expressIntegration(),
    ],
    
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers["x-api-key"];
      }
      
      // Remove sensitive data from request body
      if (event.request?.data && typeof event.request.data === "object") {
        const sensitiveFields = ["password", "token", "secret", "apiKey", "creditCard"];
        const data = event.request.data as Record<string, unknown>;
        sensitiveFields.forEach(field => {
          if (field in data) {
            data[field] = "[REDACTED]";
          }
        });
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Network errors
      "Network request failed",
      "Failed to fetch",
      "NetworkError",
      // Browser errors
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // User-triggered errors
      "AbortError",
      // Known third-party errors
      "Script error.",
    ],
    
    // Don't send errors in development by default
    enabled: ENVIRONMENT === "production" || !!process.env.SENTRY_ENABLED,
  });

  console.log(`[Sentry] Initialized for ${ENVIRONMENT} environment`);
}

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

// Request handler - adds Sentry context
export function sentryRequestHandler() {
  return Sentry.setupExpressErrorHandler;
}

// Error handler - captures errors
export function sentryErrorHandler() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Add user context if available
    const userId = (req as any).userId || (req as any).user?.id;
    if (userId) {
      Sentry.setUser({ id: userId });
    }
    
    // Add request context
    Sentry.setContext("request", {
      method: req.method,
      url: req.url,
      headers: {
        "user-agent": req.headers["user-agent"],
        referer: req.headers.referer,
      },
      ip: req.ip,
    });
    
    // Capture the error
    Sentry.captureException(err);
    
    next(err);
  };
}

// ============================================
// MANUAL ERROR CAPTURING
// ============================================

// Capture an exception with additional context
export function captureError(
  error: Error | string,
  context?: {
    user?: { id: string; email?: string; name?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  if (!SENTRY_DSN) {
    console.error("[Error]", error);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser(context.user);
    }
    
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    if (context?.level) {
      scope.setLevel(context.level);
    }
    
    if (typeof error === "string") {
      Sentry.captureMessage(error);
    } else {
      Sentry.captureException(error);
    }
  });
}

// Capture a message (non-error)
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  extra?: Record<string, any>
) {
  if (!SENTRY_DSN) {
    console.log(`[${level}]`, message, extra);
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message);
  });
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

// Start a transaction for performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {});
}

// Add breadcrumb for debugging
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = "info"
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

// ============================================
// USER FEEDBACK
// ============================================

// Capture user feedback
export function captureUserFeedback(
  eventId: string,
  feedback: {
    name: string;
    email: string;
    comments: string;
  }
) {
  if (!SENTRY_DSN) return;
  
  Sentry.captureFeedback({
    associatedEventId: eventId,
    name: feedback.name,
    email: feedback.email,
    message: feedback.comments,
  });
}

// ============================================
// CUSTOM INTEGRATIONS
// ============================================

// Database query tracking
export function trackDatabaseQuery(
  operation: string,
  table: string,
  duration: number,
  success: boolean
) {
  addBreadcrumb(
    `${operation} on ${table}`,
    "database",
    { duration, success },
    success ? "info" : "error"
  );
  
  if (!success) {
    captureMessage(`Database ${operation} failed on ${table}`, "warning", {
      operation,
      table,
      duration,
    });
  }
}

// API call tracking
export function trackAPICall(
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number
) {
  addBreadcrumb(
    `${method} ${endpoint} - ${statusCode}`,
    "http",
    { statusCode, duration },
    statusCode >= 400 ? "error" : "info"
  );
}

// ============================================
// HEALTH CHECK
// ============================================

export function getSentryStatus() {
  return {
    enabled: !!SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `dreamweldtech@${RELEASE}`,
    dsn: SENTRY_DSN ? "configured" : "not configured",
    note: ENVIRONMENT === "development" ? "Sentry is active in development mode" : undefined,
  };
}

// ============================================
// SHUTDOWN
// ============================================

export async function closeSentry() {
  await Sentry.close(2000);
}
