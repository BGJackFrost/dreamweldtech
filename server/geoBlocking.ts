import { getDb } from "./db";
// @ts-ignore - no types available
import geoip from "geoip-country";
import { sql, eq, and, desc } from "drizzle-orm";

// Country list for UI
export const COUNTRY_LIST = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BD", name: "Bangladesh" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "BG", name: "Bulgaria" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
];

export interface GeoBlockingRule {
  id: number;
  countryCode: string;
  countryName: string;
  ruleType: "block" | "allow";
  reason: string | null;
  isActive: boolean;
  hitCount: number;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Get country from IP address
export function getCountryFromIp(ipAddress: string): { code: string; name: string } | null {
  try {
    // Handle localhost and private IPs
    if (ipAddress === "127.0.0.1" || ipAddress === "::1" || ipAddress.startsWith("192.168.") || ipAddress.startsWith("10.") || ipAddress.startsWith("172.")) {
      return null; // Local/private IP - no geo restriction
    }

    // Remove IPv6 prefix if present
    const cleanIp = ipAddress.replace(/^::ffff:/, "");
    
    const geo = geoip.lookup(cleanIp);
    if (geo && geo.country) {
      const country = COUNTRY_LIST.find(c => c.code === geo.country);
      return {
        code: geo.country,
        name: country?.name || geo.country,
      };
    }
    return null;
  } catch (error) {
    console.error("[GeoBlocking] Error looking up IP:", error);
    return null;
  }
}

// Check if IP is blocked by geo rules
export async function checkGeoBlocking(ipAddress: string): Promise<{
  allowed: boolean;
  country: { code: string; name: string } | null;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { allowed: true, country: null };
  }

  const country = getCountryFromIp(ipAddress);
  if (!country) {
    return { allowed: true, country: null }; // Can't determine country - allow
  }

  try {
    // Check for allow rules first (whitelist takes priority)
    const allowRules = await db.select()
      .from(sql`geo_blocking_rules`)
      .where(sql`country_code = ${country.code} AND rule_type = 'allow' AND is_active = true`)
      .limit(1);

    if (allowRules.length > 0) {
      // Update hit count
      await db.execute(sql`UPDATE geo_blocking_rules SET hit_count = hit_count + 1 WHERE id = ${(allowRules[0] as any).id}`);
      return { allowed: true, country, reason: "Whitelist country" };
    }

    // Check for block rules
    const blockRules = await db.select()
      .from(sql`geo_blocking_rules`)
      .where(sql`country_code = ${country.code} AND rule_type = 'block' AND is_active = true`)
      .limit(1);

    if (blockRules.length > 0) {
      const rule = blockRules[0] as any;
      // Update hit count
      await db.execute(sql`UPDATE geo_blocking_rules SET hit_count = hit_count + 1 WHERE id = ${rule.id}`);
      return {
        allowed: false,
        country,
        reason: rule.reason || `Access blocked from ${country.name}`,
      };
    }

    return { allowed: true, country };
  } catch (error) {
    console.error("[GeoBlocking] Error checking rules:", error);
    return { allowed: true, country };
  }
}

// Add geo blocking rule
export async function addGeoBlockingRule(
  countryCode: string,
  countryName: string,
  ruleType: "block" | "allow",
  reason?: string,
  createdBy?: number
): Promise<{ success: boolean; message: string; ruleId?: number }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    // Check if rule already exists
    const existing = await db.select()
      .from(sql`geo_blocking_rules`)
      .where(sql`country_code = ${countryCode} AND rule_type = ${ruleType}`)
      .limit(1);

    if (existing.length > 0) {
      // Update existing rule
      await db.execute(sql`UPDATE geo_blocking_rules SET is_active = true, reason = ${reason || null}, updated_at = NOW() WHERE id = ${(existing[0] as any).id}`);
      return {
        success: true,
        message: `Rule for ${countryName} updated`,
        ruleId: (existing[0] as any).id,
      };
    }

    // Insert new rule
    const result = await db.execute(sql`
      INSERT INTO geo_blocking_rules (country_code, country_name, rule_type, reason, created_by)
      VALUES (${countryCode}, ${countryName}, ${ruleType}, ${reason || null}, ${createdBy || null})
    `);

    return {
      success: true,
      message: `${ruleType === "block" ? "Blocked" : "Allowed"} access from ${countryName}`,
      ruleId: (result as any).insertId,
    };
  } catch (error) {
    console.error("[GeoBlocking] Error adding rule:", error);
    return { success: false, message: "Failed to add rule" };
  }
}

// Remove geo blocking rule
export async function removeGeoBlockingRule(ruleId: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    await db.execute(sql`DELETE FROM geo_blocking_rules WHERE id = ${ruleId}`);
    return { success: true, message: "Rule removed successfully" };
  } catch (error) {
    console.error("[GeoBlocking] Error removing rule:", error);
    return { success: false, message: "Failed to remove rule" };
  }
}

// Toggle rule active status
export async function toggleGeoBlockingRule(ruleId: number, isActive: boolean): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    await db.execute(sql`UPDATE geo_blocking_rules SET is_active = ${isActive}, updated_at = NOW() WHERE id = ${ruleId}`);
    return { success: true, message: `Rule ${isActive ? "activated" : "deactivated"}` };
  } catch (error) {
    console.error("[GeoBlocking] Error toggling rule:", error);
    return { success: false, message: "Failed to toggle rule" };
  }
}

// List all geo blocking rules
export async function listGeoBlockingRules(options: {
  ruleType?: "block" | "allow";
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ rules: GeoBlockingRule[]; total: number }> {
  const db = await getDb();
  if (!db) {
    return { rules: [], total: 0 };
  }

  try {
    // Build where conditions
    let whereConditions = sql`1=1`;
    if (options.ruleType) {
      whereConditions = sql`${whereConditions} AND rule_type = ${options.ruleType}`;
    }
    if (options.activeOnly) {
      whereConditions = sql`${whereConditions} AND is_active = true`;
    }

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(sql`geo_blocking_rules`)
      .where(whereConditions);
    const total = countResult[0]?.count || 0;

    // Get rules
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const rules = await db.select()
      .from(sql`geo_blocking_rules`)
      .where(whereConditions)
      .orderBy(sql`created_at DESC`)
      .limit(limit)
      .offset(offset);

    return {
      rules: rules.map((r: any) => ({
        id: r.id,
        countryCode: r.country_code,
        countryName: r.country_name,
        ruleType: r.rule_type,
        reason: r.reason,
        isActive: Boolean(r.is_active),
        hitCount: r.hit_count,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      total,
    };
  } catch (error) {
    console.error("[GeoBlocking] Error listing rules:", error);
    return { rules: [], total: 0 };
  }
}

// Get geo blocking statistics
export async function getGeoBlockingStats(): Promise<{
  totalBlocked: number;
  totalAllowed: number;
  totalHits: number;
  topBlockedCountries: { countryCode: string; countryName: string; hitCount: number }[];
}> {
  const db = await getDb();
  if (!db) {
    return { totalBlocked: 0, totalAllowed: 0, totalHits: 0, topBlockedCountries: [] };
  }

  try {
    const blockedCount = await db.select({ count: sql<number>`count(*)` })
      .from(sql`geo_blocking_rules`)
      .where(sql`rule_type = 'block' AND is_active = true`);
    
    const allowedCount = await db.select({ count: sql<number>`count(*)` })
      .from(sql`geo_blocking_rules`)
      .where(sql`rule_type = 'allow' AND is_active = true`);
    
    const hitsResult = await db.select({ total: sql<number>`COALESCE(SUM(hit_count), 0)` })
      .from(sql`geo_blocking_rules`)
      .where(sql`rule_type = 'block'`);
    
    const topBlocked = await db.select()
      .from(sql`geo_blocking_rules`)
      .where(sql`rule_type = 'block' AND is_active = true`)
      .orderBy(sql`hit_count DESC`)
      .limit(10);

    return {
      totalBlocked: blockedCount[0]?.count || 0,
      totalAllowed: allowedCount[0]?.count || 0,
      totalHits: hitsResult[0]?.total || 0,
      topBlockedCountries: topBlocked.map((r: any) => ({
        countryCode: r.country_code,
        countryName: r.country_name,
        hitCount: r.hit_count,
      })),
    };
  } catch (error) {
    console.error("[GeoBlocking] Error getting stats:", error);
    return { totalBlocked: 0, totalAllowed: 0, totalHits: 0, topBlockedCountries: [] };
  }
}
