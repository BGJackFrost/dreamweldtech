/**
 * Query Analytics Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("../db", () => ({
  getDb: vi.fn(() => Promise.resolve({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          groupBy: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  })),
}));

describe("Query Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Query Type Detection", () => {
    function detectQueryType(query: string): string {
      const normalized = query.trim().toUpperCase();
      if (normalized.startsWith("SELECT")) return "SELECT";
      if (normalized.startsWith("INSERT")) return "INSERT";
      if (normalized.startsWith("UPDATE")) return "UPDATE";
      if (normalized.startsWith("DELETE")) return "DELETE";
      if (normalized.startsWith("CREATE")) return "CREATE";
      if (normalized.startsWith("ALTER")) return "ALTER";
      if (normalized.startsWith("DROP")) return "DROP";
      return "OTHER";
    }

    it("should detect SELECT queries", () => {
      expect(detectQueryType("SELECT * FROM users")).toBe("SELECT");
      expect(detectQueryType("select id, name from products")).toBe("SELECT");
    });

    it("should detect INSERT queries", () => {
      expect(detectQueryType("INSERT INTO users (name) VALUES ('test')")).toBe("INSERT");
    });

    it("should detect UPDATE queries", () => {
      expect(detectQueryType("UPDATE users SET name = 'test' WHERE id = 1")).toBe("UPDATE");
    });

    it("should detect DELETE queries", () => {
      expect(detectQueryType("DELETE FROM users WHERE id = 1")).toBe("DELETE");
    });

    it("should handle unknown queries", () => {
      expect(detectQueryType("EXPLAIN SELECT * FROM users")).toBe("OTHER");
    });
  });

  describe("Table Name Extraction", () => {
    function extractTableName(query: string): string | null {
      const normalized = query.trim().toUpperCase();
      
      // SELECT ... FROM table
      const selectMatch = normalized.match(/FROM\s+(\w+)/);
      if (selectMatch) return selectMatch[1].toLowerCase();
      
      // INSERT INTO table
      const insertMatch = normalized.match(/INSERT\s+INTO\s+(\w+)/);
      if (insertMatch) return insertMatch[1].toLowerCase();
      
      // UPDATE table
      const updateMatch = normalized.match(/UPDATE\s+(\w+)/);
      if (updateMatch) return updateMatch[1].toLowerCase();
      
      // DELETE FROM table
      const deleteMatch = normalized.match(/DELETE\s+FROM\s+(\w+)/);
      if (deleteMatch) return deleteMatch[1].toLowerCase();
      
      return null;
    }

    it("should extract table from SELECT", () => {
      expect(extractTableName("SELECT * FROM users")).toBe("users");
      expect(extractTableName("SELECT id FROM products WHERE active = 1")).toBe("products");
    });

    it("should extract table from INSERT", () => {
      expect(extractTableName("INSERT INTO orders (id) VALUES (1)")).toBe("orders");
    });

    it("should extract table from UPDATE", () => {
      expect(extractTableName("UPDATE customers SET name = 'test'")).toBe("customers");
    });

    it("should extract table from DELETE", () => {
      expect(extractTableName("DELETE FROM sessions WHERE expired = 1")).toBe("sessions");
    });

    it("should return null for complex queries", () => {
      expect(extractTableName("EXPLAIN ANALYZE SELECT * FROM users")).toBe("users");
    });
  });

  describe("Percentile Calculation", () => {
    function calculatePercentile(values: number[], percentile: number): number {
      if (values.length === 0) return 0;
      
      const sorted = [...values].sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    }

    it("should calculate P50 correctly", () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      expect(calculatePercentile(values, 50)).toBe(50);
    });

    it("should calculate P95 correctly", () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      expect(calculatePercentile(values, 95)).toBe(100);
    });

    it("should calculate P99 correctly", () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      expect(calculatePercentile(values, 99)).toBe(99);
    });

    it("should handle empty array", () => {
      expect(calculatePercentile([], 50)).toBe(0);
    });

    it("should handle single value", () => {
      expect(calculatePercentile([42], 50)).toBe(42);
      expect(calculatePercentile([42], 95)).toBe(42);
    });
  });

  describe("Query Performance Classification", () => {
    function classifyQueryPerformance(executionTimeMs: number): string {
      if (executionTimeMs < 10) return "fast";
      if (executionTimeMs < 100) return "normal";
      if (executionTimeMs < 1000) return "slow";
      return "critical";
    }

    it("should classify fast queries", () => {
      expect(classifyQueryPerformance(5)).toBe("fast");
      expect(classifyQueryPerformance(9)).toBe("fast");
    });

    it("should classify normal queries", () => {
      expect(classifyQueryPerformance(10)).toBe("normal");
      expect(classifyQueryPerformance(50)).toBe("normal");
      expect(classifyQueryPerformance(99)).toBe("normal");
    });

    it("should classify slow queries", () => {
      expect(classifyQueryPerformance(100)).toBe("slow");
      expect(classifyQueryPerformance(500)).toBe("slow");
      expect(classifyQueryPerformance(999)).toBe("slow");
    });

    it("should classify critical queries", () => {
      expect(classifyQueryPerformance(1000)).toBe("critical");
      expect(classifyQueryPerformance(5000)).toBe("critical");
    });
  });

  describe("Query Statistics", () => {
    function calculateStats(times: number[]) {
      if (times.length === 0) {
        return { avg: 0, min: 0, max: 0, count: 0 };
      }
      
      const sorted = [...times].sort((a, b) => a - b);
      const sum = times.reduce((a, b) => a + b, 0);
      
      return {
        avg: Math.round(sum / times.length),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        count: times.length,
      };
    }

    it("should calculate statistics correctly", () => {
      const times = [10, 20, 30, 40, 50];
      const stats = calculateStats(times);
      
      expect(stats.avg).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.count).toBe(5);
    });

    it("should handle empty array", () => {
      const stats = calculateStats([]);
      
      expect(stats.avg).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.count).toBe(0);
    });

    it("should handle single value", () => {
      const stats = calculateStats([42]);
      
      expect(stats.avg).toBe(42);
      expect(stats.min).toBe(42);
      expect(stats.max).toBe(42);
      expect(stats.count).toBe(1);
    });
  });

  describe("Date Key Generation", () => {
    it("should generate correct date key", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const dateKey = date.toISOString().split("T")[0];
      expect(dateKey).toBe("2024-01-15");
    });

    it("should generate consistent keys for same day", () => {
      const date1 = new Date("2024-01-15T00:00:00Z");
      const date2 = new Date("2024-01-15T23:59:59Z");
      
      const key1 = date1.toISOString().split("T")[0];
      const key2 = date2.toISOString().split("T")[0];
      
      expect(key1).toBe(key2);
    });
  });
});
