import * as Sentry from "@sentry/react";

// ============================================
// SENTRY CLIENT CONFIGURATION
// ============================================

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";
const ENVIRONMENT = import.meta.env.MODE || "development";
const RELEASE = import.meta.env.VITE_APP_VERSION || "1.0.0";

// Initialize Sentry for React
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
    
    // Replay configuration (session replay)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data?.password) {
            breadcrumb.data.password = "[REDACTED]";
          }
          return breadcrumb;
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
      "ChunkLoadError",
      // Browser errors
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // User-triggered errors
      "AbortError",
      // Known third-party errors
      "Script error.",
      // React hydration errors (common in SSR)
      "Hydration failed",
      "Text content does not match",
    ],
    
    // Don't send errors in development by default
    enabled: ENVIRONMENT === "production",
  });

  console.log(`[Sentry] Initialized for ${ENVIRONMENT} environment`);
}

// ============================================
// ERROR BOUNDARY WRAPPER
// ============================================

export const SentryErrorBoundary = Sentry.ErrorBoundary;

// ============================================
// MANUAL ERROR CAPTURING
// ============================================

export function captureError(
  error: Error | string,
  context?: {
    user?: { id: string; email?: string; name?: string };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
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
    
    if (typeof error === "string") {
      Sentry.captureMessage(error);
    } else {
      Sentry.captureException(error);
    }
  });
}

// Capture a message
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
) {
  if (!SENTRY_DSN) {
    console.log(`[${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

// ============================================
// USER CONTEXT
// ============================================

export function setUser(user: { id: string; email?: string; name?: string } | null) {
  if (user) {
    Sentry.setUser(user);
  } else {
    Sentry.setUser(null);
  }
}

// ============================================
// BREADCRUMBS
// ============================================

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

// ============================================
// PERFORMANCE
// ============================================

export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {});
}

// ============================================
// FEEDBACK
// ============================================

export function showReportDialog(eventId?: string) {
  Sentry.showReportDialog({
    eventId,
    title: "Có lỗi xảy ra",
    subtitle: "Đội ngũ kỹ thuật đã được thông báo.",
    subtitle2: "Nếu bạn muốn giúp đỡ, hãy cho chúng tôi biết điều gì đã xảy ra.",
    labelName: "Tên",
    labelEmail: "Email",
    labelComments: "Mô tả lỗi",
    labelClose: "Đóng",
    labelSubmit: "Gửi báo cáo",
    successMessage: "Cảm ơn bạn đã gửi báo cáo!",
  });
}

// ============================================
// STATUS
// ============================================

export function getSentryStatus() {
  return {
    enabled: !!SENTRY_DSN && ENVIRONMENT === "production",
    environment: ENVIRONMENT,
    release: `dreamweldtech@${RELEASE}`,
  };
}
