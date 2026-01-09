import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

// Import rate limiters
import {
  rateLimitByIP,
  rateLimitByUser,
  combinedRateLimit,
  endpointRateLimit,
  slidingWindowRateLimit,
  tieredRateLimit,
  getRateLimitStats,
  loginRateLimit,
  contactFormRateLimit,
} from "../advancedRateLimiter";

// Import sentry functions
import {
  getSentryStatus,
} from "../sentry";

// Mock request, response, and next - defined at module level
const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  ip: "192.168.1.1",
  socket: { remoteAddress: "192.168.1.1" },
  headers: {},
  path: "/api/test",
  ...overrides,
} as Request);

const createMockResponse = () => {
  const headers: Record<string, string | number> = {};
  return {
    setHeader: vi.fn((name: string, value: string | number) => {
      headers[name] = value;
    }),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    headersSent: false,
    getHeaders: () => headers,
  } as unknown as Response & { getHeaders: () => Record<string, string | number> };
};

describe("Advanced Rate Limiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rateLimitByIP", () => {
    it("should allow requests within limit", () => {
      const limiter = rateLimitByIP({ windowMs: 60000, maxRequests: 10 });
      const req = createMockRequest({ ip: "10.0.0.1" });
      const res = createMockResponse();
      const next = vi.fn();

      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should set rate limit headers", () => {
      const limiter = rateLimitByIP({ windowMs: 60000, maxRequests: 10 });
      const req = createMockRequest({ ip: "10.0.0.2" });
      const res = createMockResponse();
      const next = vi.fn();

      limiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 10);
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", expect.any(Number));
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Reset", expect.any(Number));
    });

    it("should block requests exceeding limit", () => {
      const limiter = rateLimitByIP({ windowMs: 60000, maxRequests: 2 });
      const req = createMockRequest({ ip: "10.0.0.3" });
      const res = createMockResponse();
      const next = vi.fn();

      // Make 3 requests
      limiter(req, res, next);
      limiter(req, res, next);
      limiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String),
        retryAfter: expect.any(Number),
      }));
    });

    it("should skip rate limiting when skip function returns true", () => {
      const limiter = rateLimitByIP({
        windowMs: 60000,
        maxRequests: 1,
        skip: () => true,
      });
      const req = createMockRequest({ ip: "10.0.0.4" });
      const res = createMockResponse();
      const next = vi.fn();

      // Make multiple requests
      limiter(req, res, next);
      limiter(req, res, next);
      limiter(req, res, next);

      expect(next).toHaveBeenCalledTimes(3);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("rateLimitByUser", () => {
    it("should allow requests for authenticated users", () => {
      const limiter = rateLimitByUser({ windowMs: 60000, maxRequests: 10 });
      const req = createMockRequest({ ip: "10.0.0.5" }) as any;
      req.userId = "user123";
      const res = createMockResponse();
      const next = vi.fn();

      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should skip for unauthenticated users", () => {
      const limiter = rateLimitByUser({ windowMs: 60000, maxRequests: 1 });
      const req = createMockRequest({ ip: "10.0.0.6" });
      const res = createMockResponse();
      const next = vi.fn();

      // Make multiple requests without userId
      limiter(req, res, next);
      limiter(req, res, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("endpointRateLimit", () => {
    it("should create endpoint-specific limiter", () => {
      const limiter = endpointRateLimit("test-endpoint", {
        windowMs: 60000,
        maxRequests: 5,
      });
      const req = createMockRequest({ ip: "10.0.0.7" });
      const res = createMockResponse();
      const next = vi.fn();

      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should use custom message", () => {
      const customMessage = "Custom rate limit message";
      const limiter = endpointRateLimit("test-endpoint-2", {
        windowMs: 60000,
        maxRequests: 1,
        message: customMessage,
      });
      const req = createMockRequest({ ip: "10.0.0.8" });
      const res = createMockResponse();
      const next = vi.fn();

      limiter(req, res, next);
      limiter(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: customMessage,
      }));
    });
  });

  describe("tieredRateLimit", () => {
    it("should apply different limits based on tier", () => {
      const tiers = [
        { tier: "free", windowMs: 60000, maxRequests: 10 },
        { tier: "premium", windowMs: 60000, maxRequests: 100 },
      ];
      const getTier = (req: Request) => (req as any).userTier || "free";
      const limiter = tieredRateLimit(tiers, getTier);

      const freeReq = createMockRequest({ ip: "10.0.0.9" }) as any;
      freeReq.userTier = "free";
      const res = createMockResponse();
      const next = vi.fn();

      limiter(freeReq, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Tier", "free");
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 10);
    });
  });

  describe("getRateLimitStats", () => {
    it("should return statistics object", () => {
      const stats = getRateLimitStats();

      expect(stats).toHaveProperty("ip");
      expect(stats).toHaveProperty("user");
      expect(stats).toHaveProperty("combined");
      expect(stats).toHaveProperty("endpoint");
      expect(stats.ip).toHaveProperty("total");
      expect(stats.ip).toHaveProperty("blocked");
    });
  });

  describe("Predefined Rate Limiters", () => {
    it("loginRateLimit should be configured correctly", () => {
      const req = createMockRequest({ ip: "10.0.0.10" });
      const res = createMockResponse();
      const next = vi.fn();

      loginRateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("contactFormRateLimit should be configured correctly", () => {
      const req = createMockRequest({ ip: "10.0.0.11" });
      const res = createMockResponse();
      const next = vi.fn();

      contactFormRateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

describe("Sentry Integration", () => {
  describe("getSentryStatus", () => {
    it("should return status object", () => {
      const status = getSentryStatus();

      expect(status).toHaveProperty("enabled");
      expect(status).toHaveProperty("environment");
      expect(status).toHaveProperty("release");
      expect(status).toHaveProperty("dsn");
    });

    it("should indicate DSN configuration status", () => {
      const status = getSentryStatus();

      // DSN can be either configured or not configured depending on env
      expect(["configured", "not configured"]).toContain(status.dsn);
    });

    it("should include correct release format", () => {
      const status = getSentryStatus();

      expect(status.release).toMatch(/^dreamweldtech@/);
    });
  });
});

describe("Combined Rate Limiting", () => {
  it("should apply both IP and user limits", () => {
    const limiter = combinedRateLimit({
      ipConfig: { windowMs: 60000, maxRequests: 100 },
      userConfig: { windowMs: 60000, maxRequests: 200 },
    });
    
    const req = createMockRequest({ ip: "10.0.0.12" }) as any;
    req.userId = "user456";
    const res = createMockResponse();
    const next = vi.fn();

    limiter(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe("Sliding Window Rate Limit", () => {
  it("should allow requests within window", () => {
    const limiter = slidingWindowRateLimit({
      windowMs: 60000,
      maxRequests: 10,
    });
    const req = createMockRequest({ ip: "10.0.0.13" });
    const res = createMockResponse();
    const next = vi.fn();

    limiter(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 10);
  });

  it("should support custom key generator", () => {
    const limiter = slidingWindowRateLimit({
      windowMs: 60000,
      maxRequests: 10,
      keyGenerator: (req) => `custom:${req.ip}`,
    });
    const req = createMockRequest({ ip: "10.0.0.14" });
    const res = createMockResponse();
    const next = vi.fn();

    limiter(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
