import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { userPreferences } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const userPreferencesRouter = router({
  // Get user preferences
  get: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const [pref] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, input.userId))
        .limit(1);
      
      return pref || null;
    }),

  // Update or create user preferences
  upsert: publicProcedure
    .input(z.object({
      userId: z.number(),
      language: z.enum(["vi", "en", "ja", "zh"]).optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { userId, ...data } = input;
      
      // Check if preferences exist
      const [existing] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
      
      if (existing) {
        // Update existing
        await db
          .update(userPreferences)
          .set(data)
          .where(eq(userPreferences.userId, userId));
      } else {
        // Create new
        await db.insert(userPreferences).values({
          userId,
          language: data.language || "vi",
          theme: data.theme || "system",
          timezone: data.timezone || "Asia/Ho_Chi_Minh",
          dateFormat: data.dateFormat || "DD/MM/YYYY",
        });
      }
      
      // Return updated preferences
      const [updated] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
      
      return updated;
    }),

  // Update language only
  updateLanguage: publicProcedure
    .input(z.object({
      userId: z.number(),
      language: z.enum(["vi", "en", "ja", "zh"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { userId, language } = input;
      
      // Check if preferences exist
      const [existing] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
      
      if (existing) {
        await db
          .update(userPreferences)
          .set({ language })
          .where(eq(userPreferences.userId, userId));
      } else {
        await db.insert(userPreferences).values({
          userId,
          language,
        });
      }
      
      return { success: true, language };
    }),
});
