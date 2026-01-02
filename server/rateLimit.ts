import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

/**
 * Strict auth rate limiter - 5 attempts per 15 minutes
 * For login, register, password reset endpoints
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Contact form rate limiter - 3 submissions per hour
 */
export const contactLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per windowMs
  message: 'Too many contact form submissions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Newsletter subscription rate limiter - 5 subscriptions per day
 */
export const newsletterLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 5, // 5 requests per windowMs
  message: 'Too many newsletter subscriptions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Job application rate limiter - 10 applications per day
 */
export const jobApplicationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 10, // 10 requests per windowMs
  message: 'Too many job applications, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Search rate limiter - 60 searches per minute
 */
export const searchLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per windowMs
  message: 'Too many search requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin API rate limiter - 1000 requests per hour
 * For authenticated admin users
 */
export const adminLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per windowMs
  message: 'Admin API rate limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter - 10 uploads per hour
 */
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per windowMs
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
