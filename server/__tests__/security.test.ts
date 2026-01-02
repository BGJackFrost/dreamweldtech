import { describe, it, expect } from "vitest";
import { 
  sanitizeInput, 
  validateEmail, 
  validatePassword,
  escapeSqlString 
} from "../security";

describe("Security Module", () => {
  describe("Input Sanitization", () => {
    it("should remove script tags from input", () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("</script>");
    });

    it("should remove HTML tags from input", () => {
      const htmlInput = '<div onclick="alert()">Test</div>';
      const sanitized = sanitizeInput(htmlInput);
      expect(sanitized).not.toContain("<div>");
      expect(sanitized).not.toContain("onclick");
    });

    it("should remove javascript: protocol", () => {
      const jsInput = 'javascript:alert("xss")';
      const sanitized = sanitizeInput(jsInput);
      expect(sanitized).not.toContain("javascript:");
    });

    it("should handle nested objects", () => {
      const nestedInput = {
        name: '<script>alert("xss")</script>John',
        details: {
          email: 'test@example.com<script></script>',
        },
      };
      const sanitized = sanitizeInput(nestedInput) as typeof nestedInput;
      expect(sanitized.name).not.toContain("<script>");
      expect(sanitized.details.email).not.toContain("<script>");
    });

    it("should handle arrays", () => {
      const arrayInput = ['<script>alert()</script>', 'normal text'];
      const sanitized = sanitizeInput(arrayInput) as string[];
      expect(sanitized[0]).not.toContain("<script>");
      expect(sanitized[1]).toBe("normal text");
    });
  });

  describe("Email Validation", () => {
    it("should validate correct email format", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.jp")).toBe(true);
    });

    it("should reject invalid email format", () => {
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("@domain.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user @domain.com")).toBe(false);
    });
  });

  describe("Password Validation", () => {
    it("should accept strong passwords", () => {
      const result = validatePassword("StrongP@ss123");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject short passwords", () => {
      const result = validatePassword("Sh@rt1");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters long");
    });

    it("should require uppercase letters", () => {
      const result = validatePassword("lowercase@123");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one uppercase letter");
    });

    it("should require lowercase letters", () => {
      const result = validatePassword("UPPERCASE@123");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one lowercase letter");
    });

    it("should require numbers", () => {
      const result = validatePassword("NoNumbers@Pass");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one number");
    });

    it("should require special characters", () => {
      const result = validatePassword("NoSpecial123");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one special character");
    });
  });

  describe("SQL Escape", () => {
    it("should escape single quotes", () => {
      const input = "O'Brien";
      const escaped = escapeSqlString(input);
      expect(escaped).toBe("O''Brien");
    });

    it("should escape backslashes", () => {
      const input = "path\\to\\file";
      const escaped = escapeSqlString(input);
      expect(escaped).toBe("path\\\\to\\\\file");
    });

    it("should escape newlines", () => {
      const input = "line1\nline2";
      const escaped = escapeSqlString(input);
      expect(escaped).toBe("line1\\nline2");
    });
  });
});
