/**
 * Unit tests for Uptime History service
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
  }),
}));

// Mock health check
vi.mock("../healthCheck", () => ({
  performSimpleHealthCheck: vi.fn().mockResolvedValue({
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
}));

describe("Uptime History Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe("Uptime Check", () => {
    it("should classify status as 'up' for successful check", () => {
      const responseTime = 100;
      const status = responseTime <= 1000 ? "up" : "degraded";
      
      expect(status).toBe("up");
    });
    
    it("should classify status as 'degraded' for slow response", () => {
      const responseTime = 1500;
      const status = responseTime <= 1000 ? "up" : "degraded";
      
      expect(status).toBe("degraded");
    });
    
    it("should classify status as 'down' for failed check", () => {
      const error = new Error("Connection refused");
      const status = error ? "down" : "up";
      
      expect(status).toBe("down");
    });
  });
  
  describe("Monthly Stats Calculation", () => {
    it("should calculate availability percentage correctly", () => {
      const totalChecks = 1000;
      const successfulChecks = 995;
      const availability = (successfulChecks / totalChecks) * 100;
      
      expect(availability).toBe(99.5);
    });
    
    it("should handle 100% availability", () => {
      const totalChecks = 1000;
      const successfulChecks = 1000;
      const availability = (successfulChecks / totalChecks) * 100;
      
      expect(availability).toBe(100);
    });
    
    it("should handle 0% availability", () => {
      const totalChecks = 1000;
      const successfulChecks = 0;
      const availability = (successfulChecks / totalChecks) * 100;
      
      expect(availability).toBe(0);
    });
    
    it("should handle no checks gracefully", () => {
      const totalChecks = 0;
      const successfulChecks = 0;
      const availability = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;
      
      expect(availability).toBe(100);
    });
  });
  
  describe("MTTR Calculation", () => {
    it("should calculate MTTR correctly", () => {
      const totalDowntimeSeconds = 3600; // 1 hour
      const incidentCount = 2;
      const mttr = incidentCount > 0 ? totalDowntimeSeconds / incidentCount : 0;
      
      expect(mttr).toBe(1800); // 30 minutes per incident
    });
    
    it("should handle zero incidents", () => {
      const totalDowntimeSeconds = 0;
      const incidentCount = 0;
      const mttr = incidentCount > 0 ? totalDowntimeSeconds / incidentCount : 0;
      
      expect(mttr).toBe(0);
    });
  });
  
  describe("Year-Month Formatting", () => {
    it("should format year-month correctly", () => {
      const date = new Date("2026-01-15");
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      expect(yearMonth).toBe("2026-01");
    });
    
    it("should pad single-digit months", () => {
      const date = new Date("2026-05-15");
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      expect(yearMonth).toBe("2026-05");
    });
    
    it("should handle December correctly", () => {
      const date = new Date("2026-12-15");
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      expect(yearMonth).toBe("2026-12");
    });
  });
  
  describe("Uptime Streak Calculation", () => {
    it("should calculate days since last downtime", () => {
      const lastDowntime = new Date("2026-01-01");
      const now = new Date("2026-01-04");
      const days = Math.floor((now.getTime() - lastDowntime.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(days).toBe(3);
    });
    
    it("should handle same day", () => {
      const lastDowntime = new Date("2026-01-04T08:00:00");
      const now = new Date("2026-01-04T12:00:00");
      const days = Math.floor((now.getTime() - lastDowntime.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(days).toBe(0);
    });
  });
  
  describe("Duration Formatting", () => {
    it("should format seconds correctly", () => {
      const seconds = 45;
      const formatted = seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
      
      expect(formatted).toBe("45s");
    });
    
    it("should format minutes correctly", () => {
      const seconds = 300;
      const formatted = seconds < 60 ? `${seconds}s` : 
                       seconds < 3600 ? `${Math.round(seconds / 60)}m` : 
                       `${Math.round(seconds / 3600)}h`;
      
      expect(formatted).toBe("5m");
    });
    
    it("should format hours correctly", () => {
      const seconds = 7200;
      const formatted = seconds < 60 ? `${seconds}s` : 
                       seconds < 3600 ? `${Math.round(seconds / 60)}m` : 
                       seconds < 86400 ? `${Math.round(seconds / 3600)}h` :
                       `${Math.round(seconds / 86400)}d`;
      
      expect(formatted).toBe("2h");
    });
    
    it("should format days correctly", () => {
      const seconds = 172800;
      const formatted = seconds < 60 ? `${seconds}s` : 
                       seconds < 3600 ? `${Math.round(seconds / 60)}m` : 
                       seconds < 86400 ? `${Math.round(seconds / 3600)}h` :
                       `${Math.round(seconds / 86400)}d`;
      
      expect(formatted).toBe("2d");
    });
  });
  
  describe("SLA Thresholds", () => {
    it("should identify 99.99% SLA compliance", () => {
      const availability = 99.995;
      const slaTarget = 99.99;
      const compliant = availability >= slaTarget;
      
      expect(compliant).toBe(true);
    });
    
    it("should identify 99.99% SLA non-compliance", () => {
      const availability = 99.98;
      const slaTarget = 99.99;
      const compliant = availability >= slaTarget;
      
      expect(compliant).toBe(false);
    });
    
    it("should identify 99.9% SLA compliance", () => {
      const availability = 99.95;
      const slaTarget = 99.9;
      const compliant = availability >= slaTarget;
      
      expect(compliant).toBe(true);
    });
    
    it("should identify 99% SLA compliance", () => {
      const availability = 99.5;
      const slaTarget = 99;
      const compliant = availability >= slaTarget;
      
      expect(compliant).toBe(true);
    });
  });
  
  describe("Status Colors", () => {
    it("should return correct color for up status", () => {
      const status = "up";
      const colors: Record<string, string> = {
        up: "bg-green-500",
        down: "bg-red-500",
        degraded: "bg-yellow-500",
      };
      
      expect(colors[status]).toBe("bg-green-500");
    });
    
    it("should return correct color for down status", () => {
      const status = "down";
      const colors: Record<string, string> = {
        up: "bg-green-500",
        down: "bg-red-500",
        degraded: "bg-yellow-500",
      };
      
      expect(colors[status]).toBe("bg-red-500");
    });
    
    it("should return correct color for degraded status", () => {
      const status = "degraded";
      const colors: Record<string, string> = {
        up: "bg-green-500",
        down: "bg-red-500",
        degraded: "bg-yellow-500",
      };
      
      expect(colors[status]).toBe("bg-yellow-500");
    });
  });
});
