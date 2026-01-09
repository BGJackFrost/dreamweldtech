import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";

// Import the security headers function
import { securityHeaders } from "../security";

describe("Security Headers", () => {
  // Mock request, response, and next function
  const mockRequest = (path: string = "/") => ({
    path,
  } as Request);

  const mockResponse = () => {
    const headers: Record<string, string> = {};
    return {
      setHeader: vi.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      getHeaders: () => headers,
    } as unknown as Response & { getHeaders: () => Record<string, string> };
  };

  const mockNext = vi.fn() as NextFunction;

  it("should set X-Frame-Options header", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith("X-Frame-Options", "SAMEORIGIN");
  });

  it("should set X-Content-Type-Options header", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
  });

  it("should set X-XSS-Protection header", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith("X-XSS-Protection", "1; mode=block");
  });

  it("should set Referrer-Policy header", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith("Referrer-Policy", "strict-origin-when-cross-origin");
  });

  it("should set Content-Security-Policy header", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    // Check that CSP was set
    const cspCall = (res.setHeader as any).mock.calls.find(
      (call: string[]) => call[0] === "Content-Security-Policy"
    );
    expect(cspCall).toBeDefined();
    
    const cspValue = cspCall[1];
    expect(cspValue).toContain("default-src 'self'");
    expect(cspValue).toContain("script-src");
    expect(cspValue).toContain("style-src");
    expect(cspValue).toContain("img-src");
    expect(cspValue).toContain("frame-ancestors 'self'");
  });

  it("should set Strict-Transport-Security (HSTS) header with preload", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  });

  it("should set Permissions-Policy header", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    const permissionsCall = (res.setHeader as any).mock.calls.find(
      (call: string[]) => call[0] === "Permissions-Policy"
    );
    expect(permissionsCall).toBeDefined();
    expect(permissionsCall[1]).toContain("camera=()");
    expect(permissionsCall[1]).toContain("microphone=()");
  });

  it("should set Cross-Origin-Opener-Policy header", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cross-Origin-Opener-Policy",
      "same-origin-allow-popups"
    );
  });

  it("should set Cross-Origin-Resource-Policy header", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cross-Origin-Resource-Policy",
      "same-origin"
    );
  });

  it("should set no-cache headers for admin paths", () => {
    const req = mockRequest("/admin/dashboard");
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    expect(res.setHeader).toHaveBeenCalledWith("Pragma", "no-cache");
    expect(res.setHeader).toHaveBeenCalledWith("Expires", "0");
  });

  it("should set no-cache headers for API paths", () => {
    const req = mockRequest("/api/users");
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
  });

  it("should NOT set no-cache headers for public paths", () => {
    const req = mockRequest("/products");
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    // Cache-Control should not be set for public paths
    const cacheControlCall = (res.setHeader as any).mock.calls.find(
      (call: string[]) => call[0] === "Cache-Control"
    );
    expect(cacheControlCall).toBeUndefined();
  });

  it("should call next() function", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = vi.fn();
    
    securityHeaders(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });

  it("should include upgrade-insecure-requests in CSP", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    const cspCall = (res.setHeader as any).mock.calls.find(
      (call: string[]) => call[0] === "Content-Security-Policy"
    );
    expect(cspCall[1]).toContain("upgrade-insecure-requests");
  });

  it("should include worker-src in CSP for service workers", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    const cspCall = (res.setHeader as any).mock.calls.find(
      (call: string[]) => call[0] === "Content-Security-Policy"
    );
    expect(cspCall[1]).toContain("worker-src 'self' blob:");
  });

  it("should block object-src in CSP", () => {
    const req = mockRequest();
    const res = mockResponse();
    
    securityHeaders(req, res, mockNext);
    
    const cspCall = (res.setHeader as any).mock.calls.find(
      (call: string[]) => call[0] === "Content-Security-Policy"
    );
    expect(cspCall[1]).toContain("object-src 'none'");
  });
});
