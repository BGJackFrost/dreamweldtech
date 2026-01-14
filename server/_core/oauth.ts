import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "dreamweldtech-secret-key-change-in-production";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Generate admin JWT token
function generateAdminToken(userId: number, role: string): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function registerOAuthRoutes(app: Express) {
  // Regular OAuth callback (for normal users)
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Admin OAuth callback (for admin login)
  app.get("/api/oauth/admin-callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.redirect(302, "/admin/login?error=" + encodeURIComponent("OAuth callback thiếu tham số"));
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.redirect(302, "/admin/login?error=" + encodeURIComponent("Không lấy được thông tin người dùng"));
        return;
      }

      // Upsert user to ensure they exist
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Get user from database to check role
      const database = await getDb();
      if (!database) {
        res.redirect(302, "/admin/login?error=" + encodeURIComponent("Database không khả dụng"));
        return;
      }

      const [user] = await database
        .select()
        .from(users)
        .where(eq(users.openId, userInfo.openId))
        .limit(1);

      if (!user) {
        res.redirect(302, "/admin/login?error=" + encodeURIComponent("Không tìm thấy tài khoản"));
        return;
      }

      // Check if user has admin or editor role
      if (user.role !== "admin" && user.role !== "editor") {
        res.redirect(302, "/admin/login?error=" + encodeURIComponent("Bạn không có quyền truy cập trang quản trị. Vui lòng liên hệ admin để được cấp quyền."));
        return;
      }

      // TODO: Check 2FA here if needed (for now, skip 2FA for OAuth login)
      // In production, you might want to require 2FA for OAuth admin login too

      // Generate admin JWT token
      const adminToken = generateAdminToken(user.id, user.role);

      // Also set regular session cookie for consistency
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to admin login with token
      res.redirect(302, `/admin/login?admin_token=${adminToken}`);
    } catch (error) {
      console.error("[OAuth Admin] Callback failed", error);
      res.redirect(302, "/admin/login?error=" + encodeURIComponent("OAuth callback thất bại. Vui lòng thử lại."));
    }
  });
}
