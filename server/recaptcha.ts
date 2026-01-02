/**
 * reCAPTCHA Server-side Verification
 * 
 * This module handles server-side verification of reCAPTCHA tokens.
 * Supports both reCAPTCHA v2 (checkbox) and v3 (invisible).
 */

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || "";
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// Minimum score threshold for reCAPTCHA v3 (0.0 - 1.0)
const MIN_SCORE_THRESHOLD = 0.5;

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number; // v3 only
  action?: string; // v3 only
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Verify a reCAPTCHA token
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - The expected action (for v3 verification)
 * @returns Object with success status and optional error message
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string
): Promise<{ success: boolean; error?: string; score?: number }> {
  // If no secret key is configured, skip verification (development mode)
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn("[reCAPTCHA] Secret key not configured, skipping verification");
    return { success: true };
  }

  // If no token provided, fail verification
  if (!token || token === "development-token") {
    if (process.env.NODE_ENV === "development") {
      console.warn("[reCAPTCHA] Development token accepted in dev mode");
      return { success: true };
    }
    return { success: false, error: "reCAPTCHA token is required" };
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    if (!response.ok) {
      console.error("[reCAPTCHA] Verification request failed:", response.status);
      return { success: false, error: "reCAPTCHA verification request failed" };
    }

    const data: RecaptchaVerifyResponse = await response.json();

    if (!data.success) {
      const errorCodes = data["error-codes"]?.join(", ") || "Unknown error";
      console.error("[reCAPTCHA] Verification failed:", errorCodes);
      return { success: false, error: `reCAPTCHA verification failed: ${errorCodes}` };
    }

    // For v3, check the score
    if (data.score !== undefined) {
      if (data.score < MIN_SCORE_THRESHOLD) {
        console.warn(`[reCAPTCHA] Low score: ${data.score}`);
        return { 
          success: false, 
          error: "reCAPTCHA score too low. Please try again.",
          score: data.score 
        };
      }

      // Verify action matches (v3)
      if (expectedAction && data.action !== expectedAction) {
        console.warn(`[reCAPTCHA] Action mismatch: expected ${expectedAction}, got ${data.action}`);
        return { 
          success: false, 
          error: "reCAPTCHA action mismatch",
          score: data.score 
        };
      }

      return { success: true, score: data.score };
    }

    // v2 verification successful
    return { success: true };

  } catch (error) {
    console.error("[reCAPTCHA] Verification error:", error);
    return { success: false, error: "reCAPTCHA verification error" };
  }
}

/**
 * Middleware-style verification for use in tRPC procedures
 */
export async function requireRecaptcha(
  token: string | undefined,
  action?: string
): Promise<void> {
  // Skip if not configured
  if (!RECAPTCHA_SECRET_KEY) {
    return;
  }

  if (!token) {
    throw new Error("reCAPTCHA verification required");
  }

  const result = await verifyRecaptcha(token, action);
  if (!result.success) {
    throw new Error(result.error || "reCAPTCHA verification failed");
  }
}

export default { verifyRecaptcha, requireRecaptcha };
