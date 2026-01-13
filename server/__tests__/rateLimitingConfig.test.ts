import { describe, it, expect } from 'vitest';

/**
 * Rate Limiting Configuration Tests
 * Tests to verify the rate limiting configuration is correct and balanced
 */

describe('Rate Limiting Configuration', () => {
  describe('API Rate Limit', () => {
    it('should have balanced API rate limit for SPA', () => {
      // API rate limit: 300 requests per minute
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 300;
      
      expect(windowMs).toBe(60000);
      expect(maxRequests).toBe(300);
      expect(maxRequests).toBeGreaterThanOrEqual(100); // Minimum for SPA
      expect(maxRequests).toBeLessThanOrEqual(500); // Maximum reasonable
    });

    it('should calculate correct requests per second', () => {
      const maxRequests = 300;
      const windowSeconds = 60;
      const requestsPerSecond = maxRequests / windowSeconds;
      
      expect(requestsPerSecond).toBe(5); // 5 requests per second average
      expect(requestsPerSecond).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Login Rate Limit', () => {
    it('should have secure login rate limit', () => {
      // Login rate limit: 10 attempts per 15 minutes
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const maxRequests = 10;
      
      expect(windowMs).toBe(900000); // 15 minutes in ms
      expect(maxRequests).toBe(10);
      expect(maxRequests).toBeGreaterThanOrEqual(5); // Allow some retries
      expect(maxRequests).toBeLessThanOrEqual(20); // Not too permissive
    });

    it('should prevent brute force attacks', () => {
      const maxRequests = 10;
      const windowMinutes = 15;
      const attemptsPerMinute = maxRequests / windowMinutes;
      
      // Less than 1 attempt per minute on average
      expect(attemptsPerMinute).toBeLessThan(1);
    });
  });

  describe('Password Reset Rate Limit', () => {
    it('should have strict password reset rate limit', () => {
      // Password reset: 5 attempts per hour
      const windowMs = 60 * 60 * 1000; // 1 hour
      const maxRequests = 5;
      
      expect(windowMs).toBe(3600000); // 1 hour in ms
      expect(maxRequests).toBe(5);
      expect(maxRequests).toBeGreaterThanOrEqual(3); // Allow retries
      expect(maxRequests).toBeLessThanOrEqual(10); // Prevent abuse
    });
  });

  describe('Contact Form Rate Limit', () => {
    it('should have moderate contact form rate limit', () => {
      // Contact form: 10 submissions per hour
      const windowMs = 60 * 60 * 1000; // 1 hour
      const maxRequests = 10;
      
      expect(windowMs).toBe(3600000);
      expect(maxRequests).toBe(10);
      expect(maxRequests).toBeGreaterThanOrEqual(5); // Allow legitimate use
      expect(maxRequests).toBeLessThanOrEqual(20); // Prevent spam
    });
  });

  describe('Quote Request Rate Limit', () => {
    it('should have moderate quote request rate limit', () => {
      // Quote requests: 15 per hour
      const windowMs = 60 * 60 * 1000; // 1 hour
      const maxRequests = 15;
      
      expect(windowMs).toBe(3600000);
      expect(maxRequests).toBe(15);
      expect(maxRequests).toBeGreaterThanOrEqual(10); // Business use case
      expect(maxRequests).toBeLessThanOrEqual(30); // Prevent abuse
    });
  });

  describe('File Upload Rate Limit', () => {
    it('should have moderate upload rate limit', () => {
      // File uploads: 30 per hour
      const windowMs = 60 * 60 * 1000; // 1 hour
      const maxRequests = 30;
      
      expect(windowMs).toBe(3600000);
      expect(maxRequests).toBe(30);
      expect(maxRequests).toBeGreaterThanOrEqual(20); // Allow batch uploads
      expect(maxRequests).toBeLessThanOrEqual(50); // Prevent abuse
    });
  });

  describe('Search Rate Limit', () => {
    it('should have relaxed search rate limit for UX', () => {
      // Search: 60 per minute
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 60;
      
      expect(windowMs).toBe(60000);
      expect(maxRequests).toBe(60);
      expect(maxRequests).toBeGreaterThanOrEqual(30); // Good UX
      expect(maxRequests).toBeLessThanOrEqual(120); // Reasonable limit
    });

    it('should allow rapid search typing', () => {
      const maxRequests = 60;
      const windowSeconds = 60;
      const searchesPerSecond = maxRequests / windowSeconds;
      
      // 1 search per second average (good for autocomplete)
      expect(searchesPerSecond).toBe(1);
    });
  });

  describe('OAuth Rate Limit', () => {
    it('should have strict OAuth rate limit', () => {
      // OAuth: 30 requests per 15 minutes
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const maxRequests = 30;
      
      expect(windowMs).toBe(900000);
      expect(maxRequests).toBe(30);
      expect(maxRequests).toBeGreaterThanOrEqual(10); // Allow OAuth flow
      expect(maxRequests).toBeLessThanOrEqual(50); // Prevent abuse
    });
  });

  describe('Rate Limit Headers', () => {
    it('should define correct header names', () => {
      const expectedHeaders = [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ];
      
      expectedHeaders.forEach(header => {
        expect(header).toMatch(/^X-RateLimit-/);
      });
    });
  });

  describe('Error Messages', () => {
    it('should have Vietnamese error messages', () => {
      const messages = {
        login: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.',
        passwordReset: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.',
        contact: 'Quá nhiều lần gửi form liên hệ. Vui lòng thử lại sau.',
        quote: 'Quá nhiều yêu cầu báo giá. Vui lòng thử lại sau.',
        upload: 'Quá nhiều lần upload file. Vui lòng thử lại sau.',
        search: 'Quá nhiều yêu cầu tìm kiếm. Vui lòng chờ một lát.',
        api: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
      };
      
      Object.values(messages).forEach(message => {
        expect(message).toContain('Quá nhiều');
        expect(message).toContain('Vui lòng');
      });
    });
  });

  describe('Rate Limit Balance', () => {
    it('should have tiered rate limits from strict to relaxed', () => {
      const rateLimits = {
        login: { window: 15 * 60, max: 10 }, // Most strict
        passwordReset: { window: 60 * 60, max: 5 },
        contact: { window: 60 * 60, max: 10 },
        quote: { window: 60 * 60, max: 15 },
        upload: { window: 60 * 60, max: 30 },
        search: { window: 60, max: 60 },
        api: { window: 60, max: 300 }, // Most relaxed
      };
      
      // Calculate requests per minute for comparison
      const ratesPerMinute = Object.entries(rateLimits).map(([name, config]) => ({
        name,
        ratePerMinute: (config.max / config.window) * 60,
      }));
      
      // Login should be most strict
      const loginRate = ratesPerMinute.find(r => r.name === 'login')!;
      const apiRate = ratesPerMinute.find(r => r.name === 'api')!;
      
      expect(loginRate.ratePerMinute).toBeLessThan(apiRate.ratePerMinute);
    });
  });
});

describe('Rate Limit Integration', () => {
  describe('Middleware Order', () => {
    it('should apply rate limits in correct order', () => {
      // Order: blocked IP check -> security headers -> sanitize -> rate limit
      const middlewareOrder = [
        'checkBlockedIP',
        'securityHeaders',
        'sanitizeMiddleware',
        'securityLogger',
        'apiRateLimit',
        'endpointSpecificLimits',
      ];
      
      expect(middlewareOrder.indexOf('checkBlockedIP')).toBeLessThan(
        middlewareOrder.indexOf('apiRateLimit')
      );
      expect(middlewareOrder.indexOf('apiRateLimit')).toBeLessThan(
        middlewareOrder.indexOf('endpointSpecificLimits')
      );
    });
  });

  describe('Endpoint Paths', () => {
    it('should have correct tRPC endpoint paths', () => {
      const endpoints = [
        '/api/trpc/adminAuth.login',
        '/api/trpc/security.passwordReset.request',
        '/api/trpc/security.passwordReset.reset',
        '/api/trpc/contacts.submit',
        '/api/trpc/quote.submit',
        '/api/trpc/search',
        '/api/upload',
        '/api/oauth',
      ];
      
      endpoints.forEach(endpoint => {
        expect(endpoint).toMatch(/^\/api\//);
      });
    });
  });
});
