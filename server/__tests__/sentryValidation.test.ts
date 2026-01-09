import { describe, it, expect } from "vitest";
import { getSentryStatus, initSentry } from "../sentry";

describe("Sentry DSN Validation", () => {
  it("should have SENTRY_DSN configured", () => {
    const dsn = process.env.SENTRY_DSN;
    
    // Check DSN exists
    expect(dsn).toBeDefined();
    expect(dsn).not.toBe("");
    
    // Check DSN format (should be a valid Sentry DSN URL)
    if (dsn) {
      // Sentry DSN format: https://key@org.ingest.region.sentry.io/project
      expect(dsn).toMatch(/^https:\/\/[a-f0-9]+@[a-z0-9]+\.ingest\.[a-z]+\.sentry\.io\/\d+$/i);
    }
  });

  it("should have VITE_SENTRY_DSN configured for frontend", () => {
    const viteDsn = process.env.VITE_SENTRY_DSN;
    
    // Check VITE DSN exists
    expect(viteDsn).toBeDefined();
    expect(viteDsn).not.toBe("");
  });

  it("should report Sentry as configured", () => {
    const status = getSentryStatus();
    
    expect(status.dsn).toBe("configured");
  });

  it("should initialize Sentry without errors", () => {
    // This should not throw
    expect(() => {
      initSentry();
    }).not.toThrow();
  });
});
