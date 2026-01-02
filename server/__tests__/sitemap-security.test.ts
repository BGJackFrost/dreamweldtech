import { describe, it, expect } from "vitest";
import { 
  sanitizeInput, 
  validatePassword, 
  validateEmail, 
  validateFileUpload,
  checkBruteForce,
  recordLoginAttempt,
  escapeSqlString,
  maskSensitiveData
} from "../security";
import { generateSitemap, generateRobotsTxt } from "../sitemap";

describe("Security Functions", () => {
  describe("Input Sanitization", () => {
    it("should remove script tags", () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain("<script>");
      expect(result).toContain("Hello");
    });

    it("should remove HTML tags", () => {
      const input = '<div onclick="hack()">Test</div>';
      const result = sanitizeInput(input);
      expect(result).not.toContain("<div>");
      expect(result).not.toContain("onclick");
    });

    it("should handle nested objects", () => {
      const input = {
        name: '<script>hack</script>John',
        nested: {
          value: '<img onerror="hack">'
        }
      };
      const result = sanitizeInput(input) as Record<string, unknown>;
      expect(result.name).not.toContain("<script>");
      expect((result.nested as Record<string, unknown>).value).not.toContain("onerror");
    });

    it("should handle arrays", () => {
      const input = ['<script>1</script>', '<div>2</div>'];
      const result = sanitizeInput(input) as string[];
      expect(result[0]).not.toContain("<script>");
      expect(result[1]).not.toContain("<div>");
    });
  });

  describe("Password Validation", () => {
    it("should reject short passwords", () => {
      const result = validatePassword("Ab1!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters long");
    });

    it("should require uppercase letters", () => {
      const result = validatePassword("abcdefgh1!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one uppercase letter");
    });

    it("should require lowercase letters", () => {
      const result = validatePassword("ABCDEFGH1!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one lowercase letter");
    });

    it("should require numbers", () => {
      const result = validatePassword("Abcdefgh!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one number");
    });

    it("should require special characters", () => {
      const result = validatePassword("Abcdefgh1");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one special character");
    });

    it("should accept valid passwords", () => {
      const result = validatePassword("Abcdefgh1!");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Email Validation", () => {
    it("should accept valid emails", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(validateEmail("notanemail")).toBe(false);
      expect(validateEmail("missing@domain")).toBe(false);
      expect(validateEmail("@nodomain.com")).toBe(false);
    });
  });

  describe("File Upload Validation", () => {
    it("should accept valid PDF files", () => {
      const file = {
        mimetype: "application/pdf",
        size: 1024 * 1024, // 1MB
        originalname: "resume.pdf"
      };
      const result = validateFileUpload(file, { allowedTypes: "documents" });
      expect(result.valid).toBe(true);
    });

    it("should reject files that are too large", () => {
      const file = {
        mimetype: "application/pdf",
        size: 20 * 1024 * 1024, // 20MB
        originalname: "large.pdf"
      };
      const result = validateFileUpload(file, { maxSize: 10 * 1024 * 1024 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds");
    });

    it("should reject dangerous file extensions", () => {
      const file = {
        mimetype: "application/pdf",
        size: 1024,
        originalname: "malicious.exe"
      };
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("extension not allowed");
    });

    it("should reject invalid mime types", () => {
      const file = {
        mimetype: "application/x-executable",
        size: 1024,
        originalname: "file.bin"
      };
      const result = validateFileUpload(file, { allowedTypes: "documents" });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("type not allowed");
    });
  });

  describe("Brute Force Protection", () => {
    it("should allow first attempt", () => {
      const result = checkBruteForce("new-user-test");
      expect(result.allowed).toBe(true);
    });

    it("should track failed attempts", () => {
      const identifier = "brute-force-test-" + Date.now();
      
      // Record 4 failed attempts (should still be allowed)
      for (let i = 0; i < 4; i++) {
        recordLoginAttempt(identifier, false);
      }
      
      const result = checkBruteForce(identifier);
      expect(result.allowed).toBe(true);
    });

    it("should reset on successful login", () => {
      const identifier = "reset-test-" + Date.now();
      
      recordLoginAttempt(identifier, false);
      recordLoginAttempt(identifier, false);
      recordLoginAttempt(identifier, true); // Success resets
      
      const result = checkBruteForce(identifier);
      expect(result.allowed).toBe(true);
    });
  });

  describe("SQL Escape", () => {
    it("should escape single quotes", () => {
      const input = "O'Brien";
      const result = escapeSqlString(input);
      expect(result).toBe("O''Brien");
    });

    it("should escape backslashes", () => {
      const input = "path\\to\\file";
      const result = escapeSqlString(input);
      expect(result).toBe("path\\\\to\\\\file");
    });
  });

  describe("Sensitive Data Masking", () => {
    it("should mask password fields", () => {
      const data = { username: "john", password: "secret123" };
      const result = maskSensitiveData(data);
      expect(result.username).toBe("john");
      expect(result.password).toBe("***MASKED***");
    });

    it("should mask nested sensitive fields", () => {
      const data = { 
        user: { 
          name: "john", 
          apiKey: "abc123" 
        } 
      };
      const result = maskSensitiveData(data);
      expect((result.user as Record<string, unknown>).name).toBe("john");
      expect((result.user as Record<string, unknown>).apiKey).toBe("***MASKED***");
    });
  });
});

describe("Sitemap Generation", () => {
  it("should generate valid XML sitemap", async () => {
    const sitemap = await generateSitemap();
    
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('</urlset>');
  });

  it("should include static pages", async () => {
    const sitemap = await generateSitemap();
    
    expect(sitemap).toContain("/about");
    expect(sitemap).toContain("/products");
    expect(sitemap).toContain("/careers");
    expect(sitemap).toContain("/contact");
  });

  it("should include proper priority values", async () => {
    const sitemap = await generateSitemap();
    
    expect(sitemap).toContain("<priority>1.0</priority>"); // Homepage
    expect(sitemap).toContain("<priority>0.9</priority>"); // Products
  });
});

describe("Robots.txt Generation", () => {
  it("should generate valid robots.txt", async () => {
    const robots = await generateRobotsTxt();
    
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /admin/");
    expect(robots).toContain("Sitemap:");
  });

  it("should disallow API routes", async () => {
    const robots = await generateRobotsTxt();
    
    expect(robots).toContain("Disallow: /api/");
  });
});
