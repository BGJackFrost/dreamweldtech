import { Response } from 'express';

/**
 * Set HTTP caching headers based on content type
 */
export function setCacheHeaders(res: Response, contentType: string, maxAge: number = 3600) {
  res.set('Cache-Control', `public, max-age=${maxAge}, immutable`);
  res.set('ETag', `W/"${Date.now()}"`);
}

/**
 * Caching strategies
 */
export const cacheStrategies = {
  // Static assets - cache for 1 year
  staticAssets: {
    maxAge: 31536000, // 1 year
    immutable: true,
  },

  // HTML pages - cache for 1 hour
  htmlPages: {
    maxAge: 3600, // 1 hour
    immutable: false,
  },

  // API responses - cache for 5 minutes
  apiResponses: {
    maxAge: 300, // 5 minutes
    immutable: false,
  },

  // Images - cache for 1 week
  images: {
    maxAge: 604800, // 1 week
    immutable: true,
  },

  // Fonts - cache for 1 year
  fonts: {
    maxAge: 31536000, // 1 year
    immutable: true,
  },

  // CSS/JS - cache for 1 year (with content hash)
  bundles: {
    maxAge: 31536000, // 1 year
    immutable: true,
  },

  // No cache
  noCache: {
    maxAge: 0,
    immutable: false,
    noStore: true,
  },
};

/**
 * Middleware to set appropriate cache headers
 */
export function cacheMiddleware(req: any, res: Response, next: any) {
  const path = req.path;

  // Static assets with content hash
  if (path.match(/\.(js|css|woff2?|ttf|otf|eot)$/) && path.includes('.')) {
    res.set('Cache-Control', `public, max-age=${cacheStrategies.bundles.maxAge}, immutable`);
  }
  // Images
  else if (path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    res.set('Cache-Control', `public, max-age=${cacheStrategies.images.maxAge}, immutable`);
  }
  // Fonts
  else if (path.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
    res.set('Cache-Control', `public, max-age=${cacheStrategies.fonts.maxAge}, immutable`);
  }
  // API responses
  else if (path.startsWith('/api/')) {
    res.set('Cache-Control', `public, max-age=${cacheStrategies.apiResponses.maxAge}`);
    res.set('Vary', 'Accept-Encoding, Authorization');
  }
  // HTML pages
  else if (path.endsWith('.html') || path === '/') {
    res.set('Cache-Control', `public, max-age=${cacheStrategies.htmlPages.maxAge}`);
    res.set('Vary', 'Accept-Encoding');
  }

  // Add security headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

/**
 * Compression middleware configuration
 */
export const compressionConfig = {
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6, // Compression level (0-9)
  filter: (req: any, res: Response) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression filter function
    return true;
  },
};

/**
 * ETag generation for cache validation
 */
export function generateETag(content: string): string {
  const hash = require('crypto')
    .createHash('md5')
    .update(content)
    .digest('hex');
  return `"${hash}"`;
}

/**
 * Check if content is modified based on ETag
 */
export function isModified(req: any, etag: string): boolean {
  const ifNoneMatch = req.headers['if-none-match'];
  return ifNoneMatch !== etag;
}
