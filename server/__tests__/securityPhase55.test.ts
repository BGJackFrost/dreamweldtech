import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
          groupBy: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
            having: vi.fn().mockResolvedValue([]),
          }),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
        }),
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
    execute: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
    }),
  }),
}));

// ============================================
// GEO BLOCKING TESTS
// ============================================
describe("Geo Blocking", () => {
  describe("getCountryFromIp", () => {
    it("should return null for localhost IP", async () => {
      const { getCountryFromIp } = await import("../geoBlocking");
      const result = getCountryFromIp("127.0.0.1");
      expect(result).toBeNull();
    });

    it("should return null for private IP (192.168.x.x)", async () => {
      const { getCountryFromIp } = await import("../geoBlocking");
      const result = getCountryFromIp("192.168.1.1");
      expect(result).toBeNull();
    });

    it("should return null for private IP (10.x.x.x)", async () => {
      const { getCountryFromIp } = await import("../geoBlocking");
      const result = getCountryFromIp("10.0.0.1");
      expect(result).toBeNull();
    });

    it("should return null for IPv6 localhost", async () => {
      const { getCountryFromIp } = await import("../geoBlocking");
      const result = getCountryFromIp("::1");
      expect(result).toBeNull();
    });
  });

  describe("COUNTRY_LIST", () => {
    it("should contain Vietnam", async () => {
      const { COUNTRY_LIST } = await import("../geoBlocking");
      const vietnam = COUNTRY_LIST.find(c => c.code === "VN");
      expect(vietnam).toBeDefined();
      expect(vietnam?.name).toBe("Vietnam");
    });

    it("should contain United States", async () => {
      const { COUNTRY_LIST } = await import("../geoBlocking");
      const us = COUNTRY_LIST.find(c => c.code === "US");
      expect(us).toBeDefined();
      expect(us?.name).toBe("United States");
    });

    it("should have valid 2-letter country codes", async () => {
      const { COUNTRY_LIST } = await import("../geoBlocking");
      COUNTRY_LIST.forEach(country => {
        expect(country.code).toHaveLength(2);
        expect(country.code).toMatch(/^[A-Z]{2}$/);
      });
    });
  });

  describe("checkGeoBlocking", () => {
    it("should allow access for private IPs", async () => {
      const { checkGeoBlocking } = await import("../geoBlocking");
      const result = await checkGeoBlocking("192.168.1.1");
      expect(result.allowed).toBe(true);
      expect(result.country).toBeNull();
    });
  });

  describe("listGeoBlockingRules", () => {
    it("should return empty list when no rules exist", async () => {
      const { listGeoBlockingRules } = await import("../geoBlocking");
      const result = await listGeoBlockingRules({});
      expect(result.rules).toEqual([]);
    });
  });

  describe("getGeoBlockingStats", () => {
    it("should return default stats when no data", async () => {
      const { getGeoBlockingStats } = await import("../geoBlocking");
      const result = await getGeoBlockingStats();
      expect(result).toHaveProperty("totalBlocked");
      expect(result).toHaveProperty("totalAllowed");
      expect(result).toHaveProperty("totalHits");
      expect(result).toHaveProperty("topBlockedCountries");
    });
  });
});

// ============================================
// SECURITY DASHBOARD TESTS
// ============================================
describe("Security Dashboard", () => {
  describe("getSecurityStats", () => {
    it("should return security statistics", async () => {
      const { getSecurityStats } = await import("../securityDashboard");
      const result = await getSecurityStats();
      
      expect(result).toHaveProperty("totalLogins");
      expect(result).toHaveProperty("successfulLogins");
      expect(result).toHaveProperty("failedLogins");
      expect(result).toHaveProperty("loginSuccessRate");
      expect(result).toHaveProperty("blockedIps");
      expect(result).toHaveProperty("whitelistedIps");
      expect(result).toHaveProperty("lockedIps");
      expect(result).toHaveProperty("geoBlockedCountries");
      expect(result).toHaveProperty("suspiciousActivities");
      expect(result).toHaveProperty("passwordResets");
      expect(result).toHaveProperty("twoFactorEnabled");
      expect(result).toHaveProperty("recentFailedLogins");
      expect(result).toHaveProperty("recentBlockedIps");
      expect(result).toHaveProperty("topBlockedCountries");
    });

    it("should have valid login success rate", async () => {
      const { getSecurityStats } = await import("../securityDashboard");
      const result = await getSecurityStats();
      
      expect(result.loginSuccessRate).toBeGreaterThanOrEqual(0);
      expect(result.loginSuccessRate).toBeLessThanOrEqual(100);
    });
  });

  describe("getSecurityTrends", () => {
    it("should return array of trends", async () => {
      const { getSecurityTrends } = await import("../securityDashboard");
      const result = await getSecurityTrends(30);
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getSecurityAlerts", () => {
    it("should return array of alerts", async () => {
      const { getSecurityAlerts } = await import("../securityDashboard");
      const result = await getSecurityAlerts();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

// ============================================
// AUDIT LOG EXPORT TESTS
// ============================================
describe("Audit Log Export", () => {
  describe("exportAuditLogToCsv", () => {
    it("should return CSV string with headers", async () => {
      const { exportAuditLogToCsv } = await import("../auditLog");
      const result = await exportAuditLogToCsv({});
      
      expect(typeof result).toBe("string");
      expect(result).toContain("ID");
      expect(result).toContain("Thời gian");
      expect(result).toContain("Người dùng");
    });
  });

  describe("exportAuditLogToJson", () => {
    it("should return valid JSON string", async () => {
      const { exportAuditLogToJson } = await import("../auditLog");
      const result = await exportAuditLogToJson({});
      
      expect(typeof result).toBe("string");
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("exportDate");
      expect(parsed).toHaveProperty("totalRecords");
      expect(parsed).toHaveProperty("logs");
    });
  });

  describe("getAuditLogSummary", () => {
    it("should return summary object", async () => {
      const { getAuditLogSummary } = await import("../auditLog");
      const result = await getAuditLogSummary({});
      
      expect(result).toHaveProperty("totalActions");
      expect(result).toHaveProperty("byAction");
      expect(result).toHaveProperty("byResource");
      expect(result).toHaveProperty("byStatus");
      expect(result).toHaveProperty("byUser");
      expect(result).toHaveProperty("topResources");
    });
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================
describe("Security Features Integration", () => {
  it("should have all required geo blocking functions", async () => {
    const geoBlocking = await import("../geoBlocking");
    
    expect(typeof geoBlocking.getCountryFromIp).toBe("function");
    expect(typeof geoBlocking.checkGeoBlocking).toBe("function");
    expect(typeof geoBlocking.addGeoBlockingRule).toBe("function");
    expect(typeof geoBlocking.removeGeoBlockingRule).toBe("function");
    expect(typeof geoBlocking.toggleGeoBlockingRule).toBe("function");
    expect(typeof geoBlocking.listGeoBlockingRules).toBe("function");
    expect(typeof geoBlocking.getGeoBlockingStats).toBe("function");
  });

  it("should have all required security dashboard functions", async () => {
    const dashboard = await import("../securityDashboard");
    
    expect(typeof dashboard.getSecurityStats).toBe("function");
    expect(typeof dashboard.getSecurityTrends).toBe("function");
    expect(typeof dashboard.getSecurityAlerts).toBe("function");
  });

  it("should have all required audit log export functions", async () => {
    const auditLog = await import("../auditLog");
    
    expect(typeof auditLog.exportAuditLogToCsv).toBe("function");
    expect(typeof auditLog.exportAuditLogToJson).toBe("function");
    expect(typeof auditLog.getAuditLogSummary).toBe("function");
  });
});
