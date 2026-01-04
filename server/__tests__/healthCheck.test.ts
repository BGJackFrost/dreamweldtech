import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performHealthCheck, performSimpleHealthCheck, getServerMetrics } from '../healthCheck';

// Mock getDb
vi.mock('../db', () => ({
  getDb: vi.fn().mockResolvedValue({
    execute: vi.fn().mockResolvedValue([{ health_check: 1 }])
  })
}));

describe('Health Check Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('performHealthCheck', () => {
    it('should return health check response with all required fields', async () => {
      const result = await performHealthCheck();
      
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('uptimeFormatted');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('checks');
    });

    it('should return valid status values', async () => {
      const result = await performHealthCheck();
      
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
    });

    it('should return valid timestamp in ISO format', async () => {
      const result = await performHealthCheck();
      
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return memory usage between 0 and 100', async () => {
      const result = await performHealthCheck();
      
      expect(result.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should include database check in checks array', async () => {
      const result = await performHealthCheck();
      
      const dbCheck = result.checks.find(c => c.name === 'database');
      expect(dbCheck).toBeDefined();
      expect(['pass', 'fail', 'warn']).toContain(dbCheck?.status);
    });

    it('should include memory check in checks array', async () => {
      const result = await performHealthCheck();
      
      const memCheck = result.checks.find(c => c.name === 'memory');
      expect(memCheck).toBeDefined();
      expect(['pass', 'fail', 'warn']).toContain(memCheck?.status);
    });
  });

  describe('performSimpleHealthCheck', () => {
    it('should return simple health check with status and timestamp', async () => {
      const result = await performSimpleHealthCheck();
      
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(['ok', 'error']).toContain(result.status);
    });

    it('should return ok status when database is connected', async () => {
      const result = await performSimpleHealthCheck();
      
      expect(result.status).toBe('ok');
    });
  });

  describe('getServerMetrics', () => {
    it('should return server metrics with all required fields', () => {
      const result = getServerMetrics();
      
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('pid');
      expect(result).toHaveProperty('platform');
      expect(result).toHaveProperty('nodeVersion');
    });

    it('should return valid memory metrics', () => {
      const result = getServerMetrics();
      
      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory.heapUsed).toBeLessThanOrEqual(result.memory.heapTotal);
    });

    it('should return valid CPU metrics', () => {
      const result = getServerMetrics();
      
      expect(result.cpu).toHaveProperty('user');
      expect(result.cpu).toHaveProperty('system');
      expect(result.cpu.user).toBeGreaterThanOrEqual(0);
      expect(result.cpu.system).toBeGreaterThanOrEqual(0);
    });

    it('should return positive uptime', () => {
      const result = getServerMetrics();
      
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
