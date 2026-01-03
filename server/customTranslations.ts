import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { customTranslations } from "../drizzle/schema";
import { eq, and, like, sql } from "drizzle-orm";

export const customTranslationsRouter = router({
  // Get all translations for a specific language
  getByLanguage: publicProcedure
    .input(z.object({
      language: z.string(),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const conditions = [eq(customTranslations.language, input.language)];
      
      if (input.category) {
        conditions.push(eq(customTranslations.category, input.category));
      }
      
      const translations = await db
        .select()
        .from(customTranslations)
        .where(and(...conditions));
      
      // Convert to key-value object for easy use
      const result: Record<string, string> = {};
      translations.forEach(t => {
        result[t.key] = t.value;
      });
      
      return result;
    }),

  // Get all translations (admin)
  getAll: adminProcedure
    .input(z.object({
      language: z.string().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const conditions = [];
      
      if (input.language) {
        conditions.push(eq(customTranslations.language, input.language));
      }
      if (input.category) {
        conditions.push(eq(customTranslations.category, input.category));
      }
      if (input.search) {
        conditions.push(
          sql`(${customTranslations.key} LIKE ${`%${input.search}%`} OR ${customTranslations.value} LIKE ${`%${input.search}%`})`
        );
      }
      
      const offset = (input.page - 1) * input.limit;
      
      const [translations, countResult] = await Promise.all([
        db
          .select()
          .from(customTranslations)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .limit(input.limit)
          .offset(offset)
          .orderBy(customTranslations.key),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(customTranslations)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);
      
      return {
        translations,
        total: countResult[0]?.count || 0,
        page: input.page,
        totalPages: Math.ceil((countResult[0]?.count || 0) / input.limit),
      };
    }),

  // Get single translation by key and language
  getByKey: publicProcedure
    .input(z.object({
      key: z.string(),
      language: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .select()
        .from(customTranslations)
        .where(
          and(
            eq(customTranslations.key, input.key),
            eq(customTranslations.language, input.language)
          )
        )
        .limit(1);
      
      return result[0] || null;
    }),

  // Create or update translation (upsert)
  upsert: adminProcedure
    .input(z.object({
      key: z.string(),
      language: z.string(),
      value: z.string(),
      category: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if exists
      const existing = await db
        .select()
        .from(customTranslations)
        .where(
          and(
            eq(customTranslations.key, input.key),
            eq(customTranslations.language, input.language)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        // Update
        await db
          .update(customTranslations)
          .set({
            value: input.value,
            category: input.category || existing[0].category,
            description: input.description || existing[0].description,
            updatedBy: ctx.user?.id,
          })
          .where(eq(customTranslations.id, existing[0].id));
        
        return { success: true, action: "updated", id: existing[0].id };
      } else {
        // Insert
        const result = await db
          .insert(customTranslations)
          .values({
            key: input.key,
            language: input.language,
            value: input.value,
            category: input.category || "common",
            description: input.description,
            updatedBy: ctx.user?.id,
          });
        
        return { success: true, action: "created", id: result[0].insertId };
      }
    }),

  // Bulk upsert translations
  bulkUpsert: adminProcedure
    .input(z.object({
      translations: z.array(z.object({
        key: z.string(),
        language: z.string(),
        value: z.string(),
        category: z.string().optional(),
        description: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      let created = 0;
      let updated = 0;
      
      for (const t of input.translations) {
        const existing = await db
          .select()
          .from(customTranslations)
          .where(
            and(
              eq(customTranslations.key, t.key),
              eq(customTranslations.language, t.language)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          await db
            .update(customTranslations)
            .set({
              value: t.value,
              category: t.category || existing[0].category,
              description: t.description || existing[0].description,
              updatedBy: ctx.user?.id,
            })
            .where(eq(customTranslations.id, existing[0].id));
          updated++;
        } else {
          await db
            .insert(customTranslations)
            .values({
              key: t.key,
              language: t.language,
              value: t.value,
              category: t.category || "common",
              description: t.description,
              updatedBy: ctx.user?.id,
            });
          created++;
        }
      }
      
      return { success: true, created, updated };
    }),

  // Delete translation
  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(customTranslations).where(eq(customTranslations.id, input.id));
      return { success: true };
    }),

  // Delete by key (all languages)
  deleteByKey: adminProcedure
    .input(z.object({
      key: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(customTranslations).where(eq(customTranslations.key, input.key));
      return { success: true };
    }),

  // Get all unique categories
  getCategories: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db
      .selectDistinct({ category: customTranslations.category })
      .from(customTranslations);
    
    return result.map(r => r.category).filter(Boolean) as string[];
  }),

  // Get all unique keys
  getKeys: adminProcedure
    .input(z.object({
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const conditions = input.category 
        ? [eq(customTranslations.category, input.category)]
        : [];
      
      const result = await db
        .selectDistinct({ key: customTranslations.key })
        .from(customTranslations)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      return result.map(r => r.key);
    }),

  // Export all translations
  exportAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const translations = await db.select().from(customTranslations);
    
    // Group by language
    const grouped: Record<string, Record<string, string>> = {};
    translations.forEach(t => {
      if (!grouped[t.language]) {
        grouped[t.language] = {};
      }
      grouped[t.language][t.key] = t.value;
    });
    
    return grouped;
  }),
});
