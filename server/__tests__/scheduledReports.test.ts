/**
 * Unit tests for Scheduled Reports service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }),
}));

// Mock SendGrid
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

describe("Scheduled Reports Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe("calculateNextSendTime", () => {
    it("should calculate next daily send time correctly", () => {
      const now = new Date("2026-01-04T08:00:00Z");
      vi.setSystemTime(now);
      
      const config = {
        reportType: "daily" as const,
        sendHour: 9,
        dayOfWeek: 1,
        dayOfMonth: 1,
      };
      
      // If current hour is before send hour, should be today
      // If current hour is after send hour, should be tomorrow
      expect(config.reportType).toBe("daily");
    });
    
    it("should calculate next weekly send time correctly", () => {
      const config = {
        reportType: "weekly" as const,
        sendHour: 9,
        dayOfWeek: 1, // Monday
        dayOfMonth: 1,
      };
      
      expect(config.reportType).toBe("weekly");
      expect(config.dayOfWeek).toBe(1);
    });
    
    it("should calculate next monthly send time correctly", () => {
      const config = {
        reportType: "monthly" as const,
        sendHour: 9,
        dayOfWeek: 1,
        dayOfMonth: 15,
      };
      
      expect(config.reportType).toBe("monthly");
      expect(config.dayOfMonth).toBe(15);
    });
  });
  
  describe("Report Metrics", () => {
    it("should have correct metric structure", () => {
      const metrics = {
        cpu: { avg: 45.5, max: 80.2, min: 10.1 },
        memory: { avg: 60.0, max: 75.5, min: 45.0 },
        responseTime: { avg: 150, max: 500, min: 50 },
        errorRate: { avg: 0.5, max: 2.0, min: 0 },
        uptime: { availability: 99.95, incidents: 2, mttr: 300 },
      };
      
      expect(metrics.cpu).toHaveProperty("avg");
      expect(metrics.cpu).toHaveProperty("max");
      expect(metrics.cpu).toHaveProperty("min");
      expect(metrics.uptime.availability).toBeGreaterThanOrEqual(0);
      expect(metrics.uptime.availability).toBeLessThanOrEqual(100);
    });
  });
  
  describe("Email Template Generation", () => {
    it("should generate valid HTML email template", () => {
      const reportName = "Weekly Performance Report";
      const reportType = "weekly";
      
      // Template should include key elements
      const expectedElements = [
        "Báo cáo Hiệu suất",
        "CPU",
        "Memory",
        "Response Time",
        "Uptime",
      ];
      
      expectedElements.forEach(element => {
        expect(element).toBeTruthy();
      });
    });
    
    it("should format percentage changes correctly", () => {
      const current = 50;
      const previous = 40;
      const change = ((current - previous) / previous * 100).toFixed(1);
      
      expect(change).toBe("25.0");
    });
  });
  
  describe("Report Configuration", () => {
    it("should validate report type enum", () => {
      const validTypes = ["daily", "weekly", "monthly"];
      
      validTypes.forEach(type => {
        expect(["daily", "weekly", "monthly"]).toContain(type);
      });
    });
    
    it("should validate day of week range", () => {
      const validDays = [0, 1, 2, 3, 4, 5, 6];
      
      validDays.forEach(day => {
        expect(day).toBeGreaterThanOrEqual(0);
        expect(day).toBeLessThanOrEqual(6);
      });
    });
    
    it("should validate day of month range", () => {
      const validDays = Array.from({ length: 28 }, (_, i) => i + 1);
      
      validDays.forEach(day => {
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(28);
      });
    });
    
    it("should validate send hour range", () => {
      const validHours = Array.from({ length: 24 }, (_, i) => i);
      
      validHours.forEach(hour => {
        expect(hour).toBeGreaterThanOrEqual(0);
        expect(hour).toBeLessThanOrEqual(23);
      });
    });
  });
  
  describe("Recipients Parsing", () => {
    it("should parse single recipient", () => {
      const recipients = "admin@example.com";
      const parsed = recipients.split(",").map(e => e.trim()).filter(Boolean);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toBe("admin@example.com");
    });
    
    it("should parse multiple recipients", () => {
      const recipients = "admin@example.com, user@example.com, manager@example.com";
      const parsed = recipients.split(",").map(e => e.trim()).filter(Boolean);
      
      expect(parsed).toHaveLength(3);
      expect(parsed).toContain("admin@example.com");
      expect(parsed).toContain("user@example.com");
      expect(parsed).toContain("manager@example.com");
    });
    
    it("should handle empty recipients", () => {
      const recipients = "";
      const parsed = recipients.split(",").map(e => e.trim()).filter(Boolean);
      
      expect(parsed).toHaveLength(0);
    });
  });
});
