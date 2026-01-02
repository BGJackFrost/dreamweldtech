import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  products, 
  productCategories, 
  news, 
  contactRequests, 
  siteSettings,
  InsertProduct,
  InsertProductCategory,
  InsertNews,
  InsertContactRequest,
  InsertSiteSetting
} from "../drizzle/schema";
import { eq, desc, asc, and, sql } from "drizzle-orm";

// ============================================
// PRODUCT CATEGORIES ROUTER
// ============================================
const categoriesRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(productCategories).where(eq(productCategories.isActive, "true")).orderBy(asc(productCategories.sortOrder));
  }),
  
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(productCategories).where(eq(productCategories.slug, input.slug)).limit(1);
    return result[0] || null;
  }),

  // Admin operations
  create: protectedProcedure.input(z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(productCategories).values(input as InsertProductCategory);
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.enum(["true", "false"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    await db.update(productCategories).set(data).where(eq(productCategories.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(productCategories).where(eq(productCategories.id, input.id));
    return { success: true };
  }),

  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(productCategories).orderBy(asc(productCategories.sortOrder));
  }),
});

// ============================================
// PRODUCTS ROUTER
// ============================================
const productsRouter = router({
  list: publicProcedure.input(z.object({
    categorySlug: z.string().optional(),
    featured: z.boolean().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    let query = db.select().from(products).where(eq(products.isActive, "true"));
    
    if (input?.featured) {
      query = db.select().from(products).where(and(eq(products.isActive, "true"), eq(products.isFeatured, "true")));
    }
    
    const results = await query.orderBy(asc(products.sortOrder));
    
    if (input?.categorySlug) {
      const category = await db.select().from(productCategories).where(eq(productCategories.slug, input.categorySlug)).limit(1);
      if (category[0]) {
        return results.filter(p => p.categoryId === category[0].id);
      }
    }
    
    return input?.limit ? results.slice(0, input.limit) : results;
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(products).where(eq(products.slug, input.slug)).limit(1);
    return result[0] || null;
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
    return result[0] || null;
  }),

  // Admin operations
  create: protectedProcedure.input(z.object({
    categoryId: z.number(),
    name: z.string(),
    slug: z.string(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    gallery: z.string().optional(),
    specifications: z.string().optional(),
    features: z.string().optional(),
    applications: z.string().optional(),
    brochureUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    sortOrder: z.number().optional(),
    isFeatured: z.enum(["true", "false"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(products).values(input as InsertProduct);
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    categoryId: z.number().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    gallery: z.string().optional(),
    specifications: z.string().optional(),
    features: z.string().optional(),
    applications: z.string().optional(),
    brochureUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    sortOrder: z.number().optional(),
    isFeatured: z.enum(["true", "false"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    await db.update(products).set(data).where(eq(products.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(products).where(eq(products.id, input.id));
    return { success: true };
  }),

  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(products).orderBy(asc(products.sortOrder));
  }),
});

// ============================================
// NEWS ROUTER
// ============================================
const newsRouter = router({
  list: publicProcedure.input(z.object({
    category: z.string().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    let results = await db.select().from(news).where(eq(news.isPublished, "true")).orderBy(desc(news.publishedAt));
    
    if (input?.category) {
      results = results.filter(n => n.category === input.category);
    }
    
    return input?.limit ? results.slice(0, input.limit) : results;
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(news).where(eq(news.slug, input.slug)).limit(1);
    
    // Increment view count
    if (result[0]) {
      await db.update(news).set({ viewCount: (result[0].viewCount || 0) + 1 }).where(eq(news.id, result[0].id));
    }
    
    return result[0] || null;
  }),

  // Admin operations
  create: protectedProcedure.input(z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().optional(),
    content: z.string().optional(),
    image: z.string().optional(),
    category: z.string().optional(),
    tags: z.string().optional(),
    isPublished: z.enum(["true", "false"]).optional(),
    publishedAt: z.date().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const data: InsertNews = {
      ...input,
      authorId: ctx.user?.id,
      publishedAt: input.isPublished === "true" ? (input.publishedAt || new Date()) : undefined,
    };
    await db.insert(news).values(data);
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    slug: z.string().optional(),
    excerpt: z.string().optional(),
    content: z.string().optional(),
    image: z.string().optional(),
    category: z.string().optional(),
    tags: z.string().optional(),
    isPublished: z.enum(["true", "false"]).optional(),
    publishedAt: z.date().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    
    // Set publishedAt if publishing for the first time
    if (data.isPublished === "true" && !data.publishedAt) {
      (data as any).publishedAt = new Date();
    }
    
    await db.update(news).set(data).where(eq(news.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(news).where(eq(news.id, input.id));
    return { success: true };
  }),

  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(news).orderBy(desc(news.createdAt));
  }),
});

// ============================================
// CONTACT REQUESTS ROUTER
// ============================================
const contactsRouter = router({
  submit: publicProcedure.input(z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
    subject: z.string().optional(),
    message: z.string().optional(),
    productId: z.number().optional(),
    requestType: z.enum(["contact", "quote", "support"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(contactRequests).values(input as InsertContactRequest);
    return { success: true, message: "Yêu cầu của bạn đã được gửi thành công!" };
  }),

  // Admin operations
  list: protectedProcedure.input(z.object({
    status: z.enum(["new", "read", "replied", "closed"]).optional(),
    requestType: z.enum(["contact", "quote", "support"]).optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    let results = await db.select().from(contactRequests).orderBy(desc(contactRequests.createdAt));
    
    if (input?.status) {
      results = results.filter(c => c.status === input.status);
    }
    if (input?.requestType) {
      results = results.filter(c => c.requestType === input.requestType);
    }
    
    return results;
  }),

  updateStatus: protectedProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["new", "read", "replied", "closed"]),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(contactRequests).set({ status: input.status }).where(eq(contactRequests.id, input.id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(contactRequests).where(eq(contactRequests.id, input.id));
    return { success: true };
  }),
});

// ============================================
// SITE SETTINGS ROUTER
// ============================================
const settingsRouter = router({
  get: publicProcedure.input(z.object({ key: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, input.key)).limit(1);
    return result[0]?.settingValue || null;
  }),

  getMultiple: publicProcedure.input(z.object({ keys: z.array(z.string()) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return {};
    const results = await db.select().from(siteSettings);
    const settings: Record<string, string | null> = {};
    results.forEach(s => {
      if (input.keys.includes(s.settingKey)) {
        settings[s.settingKey] = s.settingValue;
      }
    });
    return settings;
  }),

  // Admin operations
  set: protectedProcedure.input(z.object({
    key: z.string(),
    value: z.string(),
    type: z.enum(["text", "html", "json", "image"]).optional(),
    description: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, input.key)).limit(1);
    
    if (existing[0]) {
      await db.update(siteSettings).set({ 
        settingValue: input.value,
        settingType: input.type || "text",
        description: input.description,
      }).where(eq(siteSettings.settingKey, input.key));
    } else {
      await db.insert(siteSettings).values({
        settingKey: input.key,
        settingValue: input.value,
        settingType: input.type || "text",
        description: input.description,
      } as InsertSiteSetting);
    }
    
    return { success: true };
  }),

  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(siteSettings).orderBy(asc(siteSettings.settingKey));
  }),
});

// ============================================
// MAIN APP ROUTER
// ============================================
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  
  categories: categoriesRouter,
  products: productsRouter,
  news: newsRouter,
  contacts: contactsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
