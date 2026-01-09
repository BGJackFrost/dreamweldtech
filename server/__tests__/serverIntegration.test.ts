import { describe, it, expect, vi } from "vitest";

// Test that Sentry is properly initialized
describe("Server Integration", () => {
  describe("Sentry Integration", () => {
    it("should have SENTRY_DSN environment variable", () => {
      expect(process.env.SENTRY_DSN).toBeDefined();
      expect(process.env.SENTRY_DSN).not.toBe("");
    });

    it("should have VITE_SENTRY_DSN environment variable", () => {
      expect(process.env.VITE_SENTRY_DSN).toBeDefined();
      expect(process.env.VITE_SENTRY_DSN).not.toBe("");
    });
  });

  describe("Rate Limiters", () => {
    it("should export all required rate limiters", async () => {
      const rateLimiters = await import("../advancedRateLimiter");
      
      expect(rateLimiters.loginRateLimit).toBeDefined();
      expect(rateLimiters.passwordResetRateLimit).toBeDefined();
      expect(rateLimiters.contactFormRateLimit).toBeDefined();
      expect(rateLimiters.quoteRequestRateLimit).toBeDefined();
      expect(rateLimiters.uploadRateLimit).toBeDefined();
      expect(rateLimiters.searchRateLimit).toBeDefined();
      expect(rateLimiters.getRateLimitStats).toBeDefined();
    });

    it("should return valid stats from getRateLimitStats", async () => {
      const { getRateLimitStats } = await import("../advancedRateLimiter");
      const stats = getRateLimitStats();
      
      expect(stats).toHaveProperty("ip");
      expect(stats).toHaveProperty("user");
      expect(stats).toHaveProperty("combined");
      expect(stats).toHaveProperty("endpoint");
      
      expect(typeof stats.ip.total).toBe("number");
      expect(typeof stats.ip.blocked).toBe("number");
    });
  });

  describe("Sentry Functions", () => {
    it("should export all required sentry functions", async () => {
      const sentry = await import("../sentry");
      
      expect(sentry.initSentry).toBeDefined();
      expect(sentry.sentryErrorHandler).toBeDefined();
      expect(sentry.captureError).toBeDefined();
      expect(sentry.captureMessage).toBeDefined();
      expect(sentry.getSentryStatus).toBeDefined();
    });

    it("should return valid status from getSentryStatus", async () => {
      const { getSentryStatus } = await import("../sentry");
      const status = getSentryStatus();
      
      expect(status).toHaveProperty("enabled");
      expect(status).toHaveProperty("environment");
      expect(status).toHaveProperty("release");
      expect(status).toHaveProperty("dsn");
      
      expect(status.dsn).toBe("configured");
    });
  });
});
