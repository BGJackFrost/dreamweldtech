import { Request, Response, NextFunction } from "express";

// ============================================
// ADVANCED RATE LIMITING
// ============================================

interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  message?: string;        // Error message
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
  skipFailedRequests?: boolean;      // Don't count failed requests
  keyGenerator?: (req: Request) => string;  // Custom key generator
  handler?: (req: Request, res: Response) => void;  // Custom handler
  skip?: (req: Request) => boolean;  // Skip rate limiting for certain requests
  onLimitReached?: (req: Request, key: string) => void;  // Callback when limit reached
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
  blocked: boolean;
}

// Store for different rate limit types
const rateLimitStores = {
  ip: new Map<string, RateLimitEntry>(),
  user: new Map<string, RateLimitEntry>(),
  combined: new Map<string, RateLimitEntry>(),
  endpoint: new Map<string, RateLimitEntry>(),
};

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  Object.values(rateLimitStores).forEach(store => {
    Array.from(store.entries()).forEach(([key, entry]) => {
      if (entry.resetTime < now) {
        store.delete(key);
      }
    });
  });
}, 60 * 1000);

// ============================================
// RATE LIMIT BY IP
// ============================================
export function rateLimitByIP(config: Partial<RateLimitConfig> = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    message = "Too many requests from this IP, please try again later.",
    skip,
    onLimitReached,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip && skip(req)) {
      return next();
    }

    const ip = getClientIP(req);
    const key = `ip:${ip}`;
    const now = Date.now();

    let entry = rateLimitStores.ip.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now,
        blocked: false,
      };
      rateLimitStores.ip.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    setRateLimitHeaders(res, maxRequests, entry);

    if (entry.count > maxRequests) {
      entry.blocked = true;
      if (onLimitReached) {
        onLimitReached(req, key);
      }
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    next();
  };
}

// ============================================
// RATE LIMIT BY USER
// ============================================
export function rateLimitByUser(config: Partial<RateLimitConfig> = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 200,
    message = "Too many requests from your account, please try again later.",
    skip,
    onLimitReached,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip && skip(req)) {
      return next();
    }

    // Get user ID from request (set by auth middleware)
    const userId = (req as any).userId || (req as any).user?.id;
    
    // If no user ID, fall back to IP-based limiting
    if (!userId) {
      return next();
    }

    const key = `user:${userId}`;
    const now = Date.now();

    let entry = rateLimitStores.user.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now,
        blocked: false,
      };
      rateLimitStores.user.set(key, entry);
    } else {
      entry.count++;
    }

    setRateLimitHeaders(res, maxRequests, entry);

    if (entry.count > maxRequests) {
      entry.blocked = true;
      if (onLimitReached) {
        onLimitReached(req, key);
      }
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    next();
  };
}

// ============================================
// COMBINED RATE LIMIT (IP + USER)
// ============================================
export function combinedRateLimit(config: {
  ipConfig?: Partial<RateLimitConfig>;
  userConfig?: Partial<RateLimitConfig>;
} = {}) {
  const ipLimiter = rateLimitByIP(config.ipConfig || {});
  const userLimiter = rateLimitByUser(config.userConfig || {});

  return (req: Request, res: Response, next: NextFunction) => {
    // First check IP limit
    ipLimiter(req, res, (err?: any) => {
      if (err || res.headersSent) {
        return;
      }
      // Then check user limit
      userLimiter(req, res, next);
    });
  };
}

// ============================================
// ENDPOINT-SPECIFIC RATE LIMIT
// ============================================
export function endpointRateLimit(
  endpoint: string,
  config: Partial<RateLimitConfig> = {}
) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 30,
    message = `Too many requests to ${endpoint}, please try again later.`,
    skip,
    onLimitReached,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip && skip(req)) {
      return next();
    }

    const ip = getClientIP(req);
    const userId = (req as any).userId || (req as any).user?.id || "anonymous";
    const key = `endpoint:${endpoint}:${userId}:${ip}`;
    const now = Date.now();

    let entry = rateLimitStores.endpoint.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now,
        blocked: false,
      };
      rateLimitStores.endpoint.set(key, entry);
    } else {
      entry.count++;
    }

    setRateLimitHeaders(res, maxRequests, entry);

    if (entry.count > maxRequests) {
      entry.blocked = true;
      if (onLimitReached) {
        onLimitReached(req, key);
      }
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    next();
  };
}

// ============================================
// SLIDING WINDOW RATE LIMIT
// ============================================
interface SlidingWindowEntry {
  timestamps: number[];
}

const slidingWindowStore = new Map<string, SlidingWindowEntry>();

export function slidingWindowRateLimit(config: Partial<RateLimitConfig> = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    message = "Too many requests, please try again later.",
    keyGenerator,
    skip,
    onLimitReached,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator 
      ? keyGenerator(req) 
      : `sliding:${getClientIP(req)}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = slidingWindowStore.get(key);

    if (!entry) {
      entry = { timestamps: [] };
      slidingWindowStore.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    // Add current timestamp
    entry.timestamps.push(now);

    const requestCount = entry.timestamps.length;

    // Set headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - requestCount));
    res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));

    if (requestCount > maxRequests) {
      if (onLimitReached) {
        onLimitReached(req, key);
      }
      
      // Calculate retry time based on oldest request in window
      const oldestInWindow = entry.timestamps[0];
      const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      
      return res.status(429).json({
        error: message,
        retryAfter,
      });
    }

    next();
  };
}

// Clean up sliding window store
setInterval(() => {
  const now = Date.now();
  const maxWindow = 60 * 60 * 1000; // 1 hour max
  
  Array.from(slidingWindowStore.entries()).forEach(([key, entry]) => {
    entry.timestamps = entry.timestamps.filter(t => t > now - maxWindow);
    if (entry.timestamps.length === 0) {
      slidingWindowStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

// ============================================
// TIERED RATE LIMITS (Different limits for different user tiers)
// ============================================
export interface TierConfig {
  tier: string;
  windowMs: number;
  maxRequests: number;
}

const defaultTiers: TierConfig[] = [
  { tier: "anonymous", windowMs: 60 * 1000, maxRequests: 30 },
  { tier: "free", windowMs: 60 * 1000, maxRequests: 60 },
  { tier: "basic", windowMs: 60 * 1000, maxRequests: 120 },
  { tier: "premium", windowMs: 60 * 1000, maxRequests: 300 },
  { tier: "enterprise", windowMs: 60 * 1000, maxRequests: 1000 },
  { tier: "admin", windowMs: 60 * 1000, maxRequests: 5000 },
];

export function tieredRateLimit(
  tiers: TierConfig[] = defaultTiers,
  getTier: (req: Request) => string = () => "anonymous"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const tier = getTier(req);
    const tierConfig = tiers.find(t => t.tier === tier) || tiers[0];

    const ip = getClientIP(req);
    const userId = (req as any).userId || "anonymous";
    const key = `tiered:${tier}:${userId}:${ip}`;
    const now = Date.now();

    let entry = rateLimitStores.combined.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + tierConfig.windowMs,
        firstRequest: now,
        blocked: false,
      };
      rateLimitStores.combined.set(key, entry);
    } else {
      entry.count++;
    }

    setRateLimitHeaders(res, tierConfig.maxRequests, entry);
    res.setHeader("X-RateLimit-Tier", tier);

    if (entry.count > tierConfig.maxRequests) {
      entry.blocked = true;
      return res.status(429).json({
        error: `Rate limit exceeded for ${tier} tier. Please upgrade for higher limits.`,
        tier,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    next();
  };
}

// ============================================
// RATE LIMIT STATISTICS
// ============================================
export function getRateLimitStats() {
  const stats = {
    ip: {
      total: rateLimitStores.ip.size,
      blocked: 0,
    },
    user: {
      total: rateLimitStores.user.size,
      blocked: 0,
    },
    combined: {
      total: rateLimitStores.combined.size,
      blocked: 0,
    },
    endpoint: {
      total: rateLimitStores.endpoint.size,
      blocked: 0,
    },
  };

  rateLimitStores.ip.forEach(entry => {
    if (entry.blocked) stats.ip.blocked++;
  });
  rateLimitStores.user.forEach(entry => {
    if (entry.blocked) stats.user.blocked++;
  });
  rateLimitStores.combined.forEach(entry => {
    if (entry.blocked) stats.combined.blocked++;
  });
  rateLimitStores.endpoint.forEach(entry => {
    if (entry.blocked) stats.endpoint.blocked++;
  });

  return stats;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getClientIP(req: Request): string {
  // Check various headers for the real IP (behind proxies)
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(",");
    return ips[0].trim();
  }
  
  const realIP = req.headers["x-real-ip"];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }
  
  const cfConnectingIP = req.headers["cf-connecting-ip"];
  if (cfConnectingIP) {
    return Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP;
  }
  
  return req.ip || req.socket.remoteAddress || "unknown";
}

function setRateLimitHeaders(
  res: Response,
  maxRequests: number,
  entry: RateLimitEntry
) {
  res.setHeader("X-RateLimit-Limit", maxRequests);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetTime / 1000));
}

// ============================================
// PREDEFINED RATE LIMITERS
// ============================================

// For login attempts - very strict
export const loginRateLimit = endpointRateLimit("login", {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
  onLimitReached: (req, key) => {
    console.warn(`[Rate Limit] Login limit reached: ${key}, IP: ${getClientIP(req)}`);
  },
});

// For password reset - strict
export const passwordResetRateLimit = endpointRateLimit("password-reset", {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: "Too many password reset requests. Please try again after 1 hour.",
});

// For contact form - moderate
export const contactFormRateLimit = endpointRateLimit("contact", {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  message: "Too many contact form submissions. Please try again later.",
});

// For quote requests - moderate
export const quoteRequestRateLimit = endpointRateLimit("quote", {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: "Too many quote requests. Please try again later.",
});

// For API endpoints - standard
export const apiRateLimitAdvanced = combinedRateLimit({
  ipConfig: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
  userConfig: {
    windowMs: 60 * 1000,
    maxRequests: 200,
  },
});

// For file uploads - strict
export const uploadRateLimit = endpointRateLimit("upload", {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  message: "Too many file uploads. Please try again later.",
});

// For search - moderate
export const searchRateLimit = endpointRateLimit("search", {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  message: "Too many search requests. Please slow down.",
});
