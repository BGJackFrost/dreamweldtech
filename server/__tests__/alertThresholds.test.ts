import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_ALERT_THRESHOLDS } from '../alertThresholds';

// Mock getDb before importing module
vi.mock('../db', () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  })
}));

describe('Alert Thresholds Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DEFAULT_ALERT_THRESHOLDS', () => {
    it('should have all required metrics', () => {
      expect(DEFAULT_ALERT_THRESHOLDS).toHaveProperty('cpu');
      expect(DEFAULT_ALERT_THRESHOLDS).toHaveProperty('memory');
      expect(DEFAULT_ALERT_THRESHOLDS).toHaveProperty('disk');
      expect(DEFAULT_ALERT_THRESHOLDS).toHaveProperty('responseTime');
      expect(DEFAULT_ALERT_THRESHOLDS).toHaveProperty('errorRate');
    });

    it('should have warning and critical thresholds for each metric', () => {
      for (const [key, config] of Object.entries(DEFAULT_ALERT_THRESHOLDS)) {
        expect(config).toHaveProperty('warning');
        expect(config).toHaveProperty('critical');
        expect(config).toHaveProperty('unit');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('cooldownMinutes');
      }
    });

    it('should have critical threshold higher than warning for percentage metrics', () => {
      expect(DEFAULT_ALERT_THRESHOLDS.cpu.critical).toBeGreaterThan(DEFAULT_ALERT_THRESHOLDS.cpu.warning);
      expect(DEFAULT_ALERT_THRESHOLDS.memory.critical).toBeGreaterThan(DEFAULT_ALERT_THRESHOLDS.memory.warning);
      expect(DEFAULT_ALERT_THRESHOLDS.disk.critical).toBeGreaterThan(DEFAULT_ALERT_THRESHOLDS.disk.warning);
      expect(DEFAULT_ALERT_THRESHOLDS.errorRate.critical).toBeGreaterThan(DEFAULT_ALERT_THRESHOLDS.errorRate.warning);
    });

    it('should have valid cooldown values', () => {
      for (const [key, config] of Object.entries(DEFAULT_ALERT_THRESHOLDS)) {
        expect(config.cooldownMinutes).toBeGreaterThan(0);
        expect(config.cooldownMinutes).toBeLessThanOrEqual(60);
      }
    });

    it('should have percentage thresholds between 0 and 100', () => {
      const percentageMetrics = ['cpu', 'memory', 'disk', 'errorRate'];
      
      for (const metric of percentageMetrics) {
        const config = DEFAULT_ALERT_THRESHOLDS[metric as keyof typeof DEFAULT_ALERT_THRESHOLDS];
        expect(config.warning).toBeGreaterThanOrEqual(0);
        expect(config.warning).toBeLessThanOrEqual(100);
        expect(config.critical).toBeGreaterThanOrEqual(0);
        expect(config.critical).toBeLessThanOrEqual(100);
      }
    });

    it('should have responseTime thresholds in milliseconds', () => {
      const responseTimeConfig = DEFAULT_ALERT_THRESHOLDS.responseTime;
      
      expect(responseTimeConfig.unit).toBe('ms');
      expect(responseTimeConfig.warning).toBeGreaterThan(0);
      expect(responseTimeConfig.critical).toBeGreaterThan(responseTimeConfig.warning);
    });

    it('should have valid units for each metric', () => {
      expect(DEFAULT_ALERT_THRESHOLDS.cpu.unit).toBe('%');
      expect(DEFAULT_ALERT_THRESHOLDS.memory.unit).toBe('%');
      expect(DEFAULT_ALERT_THRESHOLDS.disk.unit).toBe('%');
      expect(DEFAULT_ALERT_THRESHOLDS.responseTime.unit).toBe('ms');
      expect(DEFAULT_ALERT_THRESHOLDS.errorRate.unit).toBe('%');
    });

    it('should have descriptions for each metric', () => {
      for (const [key, config] of Object.entries(DEFAULT_ALERT_THRESHOLDS)) {
        expect(config.description).toBeTruthy();
        expect(typeof config.description).toBe('string');
        expect(config.description.length).toBeGreaterThan(0);
      }
    });
  });
});
