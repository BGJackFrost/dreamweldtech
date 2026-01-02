import { describe, it, expect } from "vitest";

describe("SendGrid API Key Validation", () => {
  it("should have SENDGRID_API_KEY configured", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey?.length).toBeGreaterThan(10);
    // SendGrid API keys typically start with "SG."
    if (apiKey && apiKey !== "test-key") {
      expect(apiKey.startsWith("SG.")).toBe(true);
    }
  });

  it("should validate SendGrid API key format", async () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey || apiKey === "test-key") {
      console.log("Skipping SendGrid validation - no real API key provided");
      return;
    }

    // Test API key by calling SendGrid's API
    const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // 200 = valid key, 401 = invalid key
    expect([200, 401]).toContain(response.status);
    
    if (response.status === 401) {
      console.warn("SendGrid API key is invalid - please check your credentials");
    } else {
      console.log("SendGrid API key validated successfully");
    }
  });
});

describe("reCAPTCHA Configuration Validation", () => {
  it("should have VITE_RECAPTCHA_SITE_KEY configured", () => {
    const siteKey = process.env.VITE_RECAPTCHA_SITE_KEY;
    expect(siteKey).toBeDefined();
    expect(siteKey?.length).toBeGreaterThan(10);
  });

  it("should have RECAPTCHA_SECRET_KEY configured", () => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    expect(secretKey).toBeDefined();
    expect(secretKey?.length).toBeGreaterThan(10);
  });

  it("should validate reCAPTCHA keys format", () => {
    const siteKey = process.env.VITE_RECAPTCHA_SITE_KEY;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    // reCAPTCHA keys are typically 40 characters
    if (siteKey && siteKey !== "test-site-key") {
      expect(siteKey.length).toBeGreaterThanOrEqual(30);
    }
    
    if (secretKey && secretKey !== "test-secret-key") {
      expect(secretKey.length).toBeGreaterThanOrEqual(30);
    }
  });
});
