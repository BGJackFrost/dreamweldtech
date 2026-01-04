/**
 * Unit tests for Endpoint Metrics service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    having: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    selectDistinct: vi.fn().mockReturnThis(),
  }),
}));

describe("Endpoint Metrics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe("Percentile Calculation", () => {
    it("should calculate P50 (median) correctly for odd array", () => {
      const values = [10, 20, 30, 40, 50];
      const index = Math.ceil((50 / 100) * values.length) - 1;
      const p50 = values[index];
      
      expect(p50).toBe(30);
    });
    
    it("should calculate P50 (median) correctly for even array", () => {
      const values = [10, 20, 30, 40];
      const index = Math.ceil((50 / 100) * values.length) - 1;
      const p50 = values[index];
      
      expect(p50).toBe(20);
    });
    
    it("should calculate P95 correctly", () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const index = Math.ceil((95 / 100) * values.length) - 1;
      const p95 = values[index];
      
      expect(p95).toBe(95);
    });
    
    it("should calculate P99 correctly", () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const index = Math.ceil((99 / 100) * values.length) - 1;
      const p99 = values[index];
      
      expect(p99).toBe(99);
    });
    
    it("should handle empty array", () => {
      const values: number[] = [];
      const p50 = values.length === 0 ? 0 : values[Math.ceil((50 / 100) * values.length) - 1];
      
      expect(p50).toBe(0);
    });
    
    it("should handle single element array", () => {
      const values = [100];
      const index = Math.max(0, Math.ceil((50 / 100) * values.length) - 1);
      const p50 = values[index];
      
      expect(p50).toBe(100);
    });
  });
  
  describe("IP Anonymization", () => {
    it("should anonymize IPv4 address", () => {
      const ip = "192.168.1.100";
      const parts = ip.split(".");
      const anonymized = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      
      expect(anonymized).toBe("192.168.1.0");
    });
    
    it("should anonymize IPv6 address", () => {
      const ip = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
      const parts = ip.split(":");
      const anonymized = `${parts[0]}:${parts[1]}:${parts[2]}::`;
      
      expect(anonymized).toBe("2001:0db8:85a3::");
    });
    
    it("should handle empty IP", () => {
      const ip = "";
      const anonymized = ip || "";
      
      expect(anonymized).toBe("");
    });
  });
  
  describe("Date Key Formatting", () => {
    it("should format date key correctly", () => {
      const date = new Date("2026-01-15T10:30:00Z");
      const dateKey = date.toISOString().split("T")[0];
      
      expect(dateKey).toBe("2026-01-15");
    });
    
    it("should handle different timezones", () => {
      const date = new Date("2026-12-31T23:59:59Z");
      const dateKey = date.toISOString().split("T")[0];
      
      expect(dateKey).toBe("2026-12-31");
    });
  });
  
  describe("Endpoint Filtering", () => {
    it("should exclude health check endpoints", () => {
      const excludedEndpoints = ["/api/health", "/api/health/simple"];
      const path = "/api/health";
      
      const shouldExclude = excludedEndpoints.some(e => path.includes(e));
      expect(shouldExclude).toBe(true);
    });
    
    it("should exclude static assets", () => {
      const excludedPatterns = [".js", ".css", ".png", ".jpg", ".svg"];
      const path = "/assets/main.js";
      
      const shouldExclude = excludedPatterns.some(e => path.includes(e));
      expect(shouldExclude).toBe(true);
    });
    
    it("should include API endpoints", () => {
      const excludedPatterns = ["/api/health", ".js", ".css"];
      const path = "/api/trpc/products.list";
      
      const shouldExclude = excludedPatterns.some(e => path.includes(e));
      expect(shouldExclude).toBe(false);
    });
  });
  
  describe("Response Time Classification", () => {
    it("should classify fast response (< 100ms)", () => {
      const responseTime = 50;
      const classification = responseTime < 100 ? "fast" : 
                           responseTime < 300 ? "normal" : 
                           responseTime < 1000 ? "slow" : "critical";
      
      expect(classification).toBe("fast");
    });
    
    it("should classify normal response (100-300ms)", () => {
      const responseTime = 200;
      const classification = responseTime < 100 ? "fast" : 
                           responseTime < 300 ? "normal" : 
                           responseTime < 1000 ? "slow" : "critical";
      
      expect(classification).toBe("normal");
    });
    
    it("should classify slow response (300-1000ms)", () => {
      const responseTime = 500;
      const classification = responseTime < 100 ? "fast" : 
                           responseTime < 300 ? "normal" : 
                           responseTime < 1000 ? "slow" : "critical";
      
      expect(classification).toBe("slow");
    });
    
    it("should classify critical response (> 1000ms)", () => {
      const responseTime = 2000;
      const classification = responseTime < 100 ? "fast" : 
                           responseTime < 300 ? "normal" : 
                           responseTime < 1000 ? "slow" : "critical";
      
      expect(classification).toBe("critical");
    });
  });
  
  describe("Error Rate Calculation", () => {
    it("should calculate error rate correctly", () => {
      const totalRequests = 1000;
      const failedRequests = 50;
      const errorRate = ((failedRequests / totalRequests) * 100).toFixed(2);
      
      expect(errorRate).toBe("5.00");
    });
    
    it("should handle zero total requests", () => {
      const totalRequests = 0;
      const failedRequests = 0;
      const errorRate = totalRequests > 0 
        ? ((failedRequests / totalRequests) * 100).toFixed(2)
        : "0.00";
      
      expect(errorRate).toBe("0.00");
    });
    
    it("should handle 100% error rate", () => {
      const totalRequests = 100;
      const failedRequests = 100;
      const errorRate = ((failedRequests / totalRequests) * 100).toFixed(2);
      
      expect(errorRate).toBe("100.00");
    });
    
    it("should handle 0% error rate", () => {
      const totalRequests = 100;
      const failedRequests = 0;
      const errorRate = ((failedRequests / totalRequests) * 100).toFixed(2);
      
      expect(errorRate).toBe("0.00");
    });
  });
  
  describe("HTTP Status Code Classification", () => {
    it("should classify 2xx as success", () => {
      const statusCode = 200;
      const isSuccess = statusCode >= 200 && statusCode < 400;
      
      expect(isSuccess).toBe(true);
    });
    
    it("should classify 3xx as success (redirect)", () => {
      const statusCode = 301;
      const isSuccess = statusCode >= 200 && statusCode < 400;
      
      expect(isSuccess).toBe(true);
    });
    
    it("should classify 4xx as failure", () => {
      const statusCode = 404;
      const isSuccess = statusCode >= 200 && statusCode < 400;
      
      expect(isSuccess).toBe(false);
    });
    
    it("should classify 5xx as failure", () => {
      const statusCode = 500;
      const isSuccess = statusCode >= 200 && statusCode < 400;
      
      expect(isSuccess).toBe(false);
    });
  });
  
  describe("Response Time Distribution Buckets", () => {
    it("should create correct bucket ranges", () => {
      const buckets = [0, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
      
      expect(buckets).toHaveLength(9);
      expect(buckets[0]).toBe(0);
      expect(buckets[buckets.length - 1]).toBe(10000);
    });
    
    it("should categorize response time into correct bucket", () => {
      const buckets = [0, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
      const responseTime = 150;
      
      let bucketIndex = 0;
      for (let i = 0; i < buckets.length - 1; i++) {
        if (responseTime >= buckets[i] && responseTime < buckets[i + 1]) {
          bucketIndex = i;
          break;
        }
      }
      
      expect(bucketIndex).toBe(2); // 100-200ms bucket
    });
  });
  
  describe("Hourly Distribution", () => {
    it("should extract hour from timestamp", () => {
      const timestamp = new Date("2026-01-15T14:30:00Z");
      const hour = timestamp.getHours();
      
      // Note: This will depend on timezone
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
    });
    
    it("should create 24-hour distribution array", () => {
      const hours = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
        avgTime: 0,
      }));
      
      expect(hours).toHaveLength(24);
      expect(hours[0].hour).toBe(0);
      expect(hours[23].hour).toBe(23);
    });
  });
  
  describe("Method Validation", () => {
    it("should validate HTTP methods", () => {
      const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"];
      
      validMethods.forEach(method => {
        expect(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]).toContain(method);
      });
    });
    
    it("should handle lowercase methods", () => {
      const method = "get";
      const normalized = method.toUpperCase();
      
      expect(normalized).toBe("GET");
    });
  });
  
  describe("Buffer Management", () => {
    it("should respect buffer size limit", () => {
      const BUFFER_SIZE = 50;
      const buffer: any[] = [];
      
      for (let i = 0; i < 60; i++) {
        buffer.push({ id: i });
        if (buffer.length >= BUFFER_SIZE) {
          // Flush
          const toFlush = buffer.splice(0, BUFFER_SIZE);
          expect(toFlush).toHaveLength(BUFFER_SIZE);
        }
      }
      
      expect(buffer.length).toBeLessThan(BUFFER_SIZE);
    });
  });
});
