import { Request, Response, NextFunction } from "express";

// ============================================
// RATE LIMITING
// ============================================
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

// Get client IP from request, considering proxies
function getClientIP(req: Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(",");
    return ips[0].trim();
  }
  const realIP = req.headers["x-real-ip"];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function rateLimit(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 100, // 100 requests per window default
    message = "Too many requests, please try again later.",
    keyGenerator = (req) => getClientIP(req),
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      entry = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - entry.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}

// Stricter rate limit for sensitive endpoints
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: "Too many attempts, please try again after 15 minutes.",
});

// API rate limit - increased for SPA with multiple API calls
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute (increased for SPA with many components)
  message: "Too many requests. Please try again later.",
});

// ============================================
// INPUT SANITIZATION
// ============================================
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === "string") {
    // Remove potentially dangerous HTML/script tags
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query) as typeof req.query;
  }
  next();
}

// ============================================
// SECURITY HEADERS
// ============================================
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Enable XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Content Security Policy (comprehensive)
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self, inline (for React), eval (for dev), Google services
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://maps.googleapis.com https://analytics.google.com",
    // Styles: self, inline (for styled-components/emotion), Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts: self, Google Fonts
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images: self, data URIs, HTTPS, blob (for canvas)
    "img-src 'self' data: https: blob:",
    // Connect: self, HTTPS APIs, WebSocket
    "connect-src 'self' https: wss: ws:",
    // Frames: self, Google (reCAPTCHA, Maps)
    "frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube.com",
    // Media: self, HTTPS
    "media-src 'self' https: blob:",
    // Objects: none (no Flash/plugins)
    "object-src 'none'",
    // Base URI: self only
    "base-uri 'self'",
    // Form actions: self only
    "form-action 'self'",
    // Frame ancestors: self only (prevents embedding)
    "frame-ancestors 'self'",
    // Upgrade insecure requests in production
    "upgrade-insecure-requests",
    // Worker sources
    "worker-src 'self' blob:"
  ];
  
  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
  
  // Strict Transport Security (HSTS) - 1 year with preload
  res.setHeader(
    "Strict-Transport-Security", 
    "max-age=31536000; includeSubDomains; preload"
  );
  
  // Permissions Policy (Feature Policy replacement)
  res.setHeader(
    "Permissions-Policy",
    "accelerometer=(), ambient-light-sensor=(), autoplay=(self), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(self), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(self), geolocation=(self), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(self), usb=(), web-share=(self), xr-spatial-tracking=()"
  );
  
  // Cross-Origin policies for additional security
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  
  // Cache control for security-sensitive pages
  if (_req.path.startsWith("/admin") || _req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  
  next();
}

// ============================================
// CSRF PROTECTION
// ============================================
const csrfTokens = new Map<string, { token: string; expires: number }>();

export function generateCsrfToken(sessionId: string): string {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

// Clean up expired CSRF tokens
setInterval(() => {
  const now = Date.now();
  Array.from(csrfTokens.entries()).forEach(([key, entry]) => {
    if (entry.expires < now) {
      csrfTokens.delete(key);
    }
  });
}, 60 * 60 * 1000); // Every hour

// ============================================
// SQL INJECTION PREVENTION (for raw queries)
// ============================================
export function escapeSqlString(str: string): string {
  return str
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\")
    .replace(/\x00/g, "\\0")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\x1a/g, "\\Z");
}

// ============================================
// PASSWORD VALIDATION
// ============================================
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================
// EMAIL VALIDATION
// ============================================
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================
// IP BLOCKING (for suspicious activity)
// ============================================
const blockedIPs = new Set<string>();
const suspiciousActivity = new Map<string, number>();

export function checkBlockedIP(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  
  if (blockedIPs.has(ip)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  
  next();
}

export function recordSuspiciousActivity(ip: string) {
  const count = (suspiciousActivity.get(ip) || 0) + 1;
  suspiciousActivity.set(ip, count);
  
  // Block IP after 10 suspicious activities
  if (count >= 10) {
    blockedIPs.add(ip);
    console.warn(`[Security] Blocked IP: ${ip} due to suspicious activity`);
  }
}

// ============================================
// REQUEST LOGGING (for security auditing)
// ============================================
export function securityLogger(req: Request, _res: Response, next: NextFunction) {
  const log = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
    referer: req.headers["referer"],
  };
  
  // Log to console in development
  if (process.env.NODE_ENV !== "production") {
    console.log("[Security Log]", JSON.stringify(log));
  }
  
  next();
}

// ============================================
// HONEYPOT DETECTION (Bot protection)
// ============================================
export function honeypotMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for honeypot fields that bots might fill
  const honeypotFields = ["website", "url", "fax", "company_website"];
  
  for (const field of honeypotFields) {
    if (req.body && req.body[field]) {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      recordSuspiciousActivity(ip);
      console.warn(`[Security] Honeypot triggered by IP: ${ip}, field: ${field}`);
      res.status(400).json({ error: "Invalid request" });
      return;
    }
  }
  
  next();
}

// ============================================
// FILE UPLOAD VALIDATION
// ============================================
const ALLOWED_FILE_TYPES = {
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
};

export function validateFileUpload(
  file: { mimetype: string; size: number; originalname: string },
  options: { maxSize?: number; allowedTypes?: "documents" | "images" | "all" } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = "all" } = options;
  
  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }
  
  // Check file type
  let allowed: string[] = [];
  if (allowedTypes === "documents") {
    allowed = ALLOWED_FILE_TYPES.documents;
  } else if (allowedTypes === "images") {
    allowed = ALLOWED_FILE_TYPES.images;
  } else {
    allowed = [...ALLOWED_FILE_TYPES.documents, ...ALLOWED_FILE_TYPES.images];
  }
  
  if (!allowed.includes(file.mimetype)) {
    return { valid: false, error: "File type not allowed" };
  }
  
  // Check for dangerous file extensions
  const dangerousExtensions = [".exe", ".bat", ".cmd", ".sh", ".php", ".js", ".html", ".htm"];
  const ext = "." + file.originalname.split(".").pop()?.toLowerCase();
  if (dangerousExtensions.includes(ext)) {
    return { valid: false, error: "File extension not allowed" };
  }
  
  return { valid: true };
}

// ============================================
// BRUTE FORCE PROTECTION
// ============================================
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();

export function checkBruteForce(identifier: string): { allowed: boolean; waitTime?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  
  if (!entry) {
    return { allowed: true };
  }
  
  // Check if blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return { allowed: false, waitTime: Math.ceil((entry.blockedUntil - now) / 1000) };
  }
  
  // Reset if last attempt was more than 15 minutes ago
  if (now - entry.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }
  
  return { allowed: true };
}

export function recordLoginAttempt(identifier: string, success: boolean) {
  const now = Date.now();
  const entry = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
  
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }
  
  entry.count++;
  entry.lastAttempt = now;
  
  // Progressive blocking
  if (entry.count >= 5) {
    // Block for increasing durations: 1min, 5min, 15min, 30min, 1hour
    const blockDurations = [60, 300, 900, 1800, 3600];
    const blockIndex = Math.min(entry.count - 5, blockDurations.length - 1);
    entry.blockedUntil = now + blockDurations[blockIndex] * 1000;
    console.warn(`[Security] Brute force protection: ${identifier} blocked for ${blockDurations[blockIndex]}s`);
  }
  
  loginAttempts.set(identifier, entry);
}

// Clean up old login attempts
setInterval(() => {
  const now = Date.now();
  const threshold = 30 * 60 * 1000; // 30 minutes
  Array.from(loginAttempts.entries()).forEach(([key, entry]) => {
    if (now - entry.lastAttempt > threshold && (!entry.blockedUntil || entry.blockedUntil < now)) {
      loginAttempts.delete(key);
    }
  });
}, 10 * 60 * 1000); // Every 10 minutes

// ============================================
// REQUEST SIZE VALIDATION
// ============================================
export function validateRequestSize(maxSize: number = 1024 * 1024) { // 1MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    
    if (contentLength > maxSize) {
      res.status(413).json({ error: "Request entity too large" });
      return;
    }
    
    next();
  };
}

// ============================================
// SENSITIVE DATA MASKING (for logs)
// ============================================
export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ["password", "token", "secret", "apiKey", "creditCard", "ssn"];
  const masked: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = "***MASKED***";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

// ============================================
// EXPORT ALL MIDDLEWARE
// ============================================
export const securityMiddleware = [
  checkBlockedIP,
  securityHeaders,
  apiRateLimit,
  sanitizeMiddleware,
  securityLogger,
];
