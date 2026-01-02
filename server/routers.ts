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
  newsletterSubscribers,
  faqs,
  homePageSections,
  caseStudies,
  users,
  InsertProduct,
  InsertProductCategory,
  InsertNews,
  InsertContactRequest,
  InsertSiteSetting,
  InsertNewsletterSubscriber,
  InsertFAQ,
  InsertHomePageSection,
  InsertCaseStudy
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
    search: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { items: [], total: 0 };
    
    let results = await db.select().from(products).where(eq(products.isActive, "true")).orderBy(asc(products.sortOrder));
    
    if (input?.featured) {
      results = results.filter(p => p.isFeatured === "true");
    }
    
    if (input?.categorySlug) {
      const category = await db.select().from(productCategories).where(eq(productCategories.slug, input.categorySlug)).limit(1);
      if (category[0]) {
        results = results.filter(p => p.categoryId === category[0].id);
      }
    }
    
    // Search filter
    if (input?.search && input.search.length >= 2) {
      const searchLower = input.search.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(searchLower)) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }
    
    const total = results.length;
    const items = input?.limit ? results.slice(0, input.limit) : results;
    
    return { items, total };
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
    search: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { items: [], total: 0 };
    
    let results = await db.select().from(news).where(eq(news.isPublished, "true")).orderBy(desc(news.publishedAt));
    
    if (input?.category) {
      results = results.filter(n => n.category === input.category);
    }
    
    // Search filter
    if (input?.search && input.search.length >= 2) {
      const searchLower = input.search.toLowerCase();
      results = results.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        (n.excerpt && n.excerpt.toLowerCase().includes(searchLower)) ||
        (n.content && n.content.toLowerCase().includes(searchLower))
      );
    }
    
    const total = results.length;
    const items = input?.limit ? results.slice(0, input.limit) : results;
    
    return { items, total };
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
// NEWSLETTER ROUTER
// ============================================
const newsletterRouter = router({
  subscribe: publicProcedure.input(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    source: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Check if already subscribed
    const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, input.email)).limit(1);
    
    if (existing[0]) {
      if (existing[0].status === "unsubscribed") {
        // Re-subscribe
        await db.update(newsletterSubscribers).set({ 
          status: "active",
          subscribedAt: new Date(),
          unsubscribedAt: null,
        }).where(eq(newsletterSubscribers.id, existing[0].id));
        return { success: true, message: "Đã đăng ký lại thành công!" };
      }
      return { success: false, message: "Email này đã được đăng ký." };
    }
    
    await db.insert(newsletterSubscribers).values({
      email: input.email,
      name: input.name,
      source: input.source || "website",
    } as InsertNewsletterSubscriber);
    
    return { success: true, message: "Đăng ký thành công!" };
  }),

  unsubscribe: publicProcedure.input(z.object({
    email: z.string().email(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.update(newsletterSubscribers).set({ 
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    }).where(eq(newsletterSubscribers.email, input.email));
    
    return { success: true };
  }),

  // Admin operations
  list: protectedProcedure.input(z.object({
    status: z.enum(["active", "unsubscribed"]).optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    if (input?.status) {
      return db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.status, input.status)).orderBy(desc(newsletterSubscribers.subscribedAt));
    }
    
    return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, input.id));
    return { success: true };
  }),

  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, active: 0, unsubscribed: 0 };
    
    const all = await db.select().from(newsletterSubscribers);
    const active = all.filter(s => s.status === "active").length;
    const unsubscribed = all.filter(s => s.status === "unsubscribed").length;
    
    return { total: all.length, active, unsubscribed };
  }),
});

// ============================================
// FAQ ROUTER
// ============================================
const faqRouter = router({
  list: publicProcedure.input(z.object({
    category: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    let results = await db.select().from(faqs).where(eq(faqs.isActive, "true")).orderBy(asc(faqs.sortOrder));
    
    if (input?.category) {
      results = results.filter(f => f.category === input.category);
    }
    
    return results;
  }),

  // Admin operations
  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(faqs).orderBy(asc(faqs.sortOrder));
  }),

  create: protectedProcedure.input(z.object({
    question: z.string(),
    questionEn: z.string().optional(),
    answer: z.string(),
    answerEn: z.string().optional(),
    category: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(faqs).values(input as InsertFAQ);
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    question: z.string().optional(),
    questionEn: z.string().optional(),
    answer: z.string().optional(),
    answerEn: z.string().optional(),
    category: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.enum(["true", "false"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    await db.update(faqs).set(data).where(eq(faqs.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(faqs).where(eq(faqs.id, input.id));
    return { success: true };
  }),
});

// ============================================
// HOME PAGE SECTIONS ROUTER
// ============================================
const homePageRouter = router({
  getSections: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(homePageSections).where(eq(homePageSections.isActive, "true")).orderBy(asc(homePageSections.sortOrder));
  }),

  getSection: publicProcedure.input(z.object({ key: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(homePageSections).where(eq(homePageSections.sectionKey, input.key)).limit(1);
    return result[0] || null;
  }),

  // Admin operations
  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(homePageSections).orderBy(asc(homePageSections.sortOrder));
  }),

  upsert: protectedProcedure.input(z.object({
    sectionKey: z.string(),
    title: z.string().optional(),
    titleEn: z.string().optional(),
    subtitle: z.string().optional(),
    subtitleEn: z.string().optional(),
    content: z.string().optional(),
    contentEn: z.string().optional(),
    image: z.string().optional(),
    backgroundImage: z.string().optional(),
    buttonText: z.string().optional(),
    buttonTextEn: z.string().optional(),
    buttonLink: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.enum(["true", "false"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const existing = await db.select().from(homePageSections).where(eq(homePageSections.sectionKey, input.sectionKey)).limit(1);
    
    if (existing[0]) {
      const { sectionKey, ...data } = input;
      await db.update(homePageSections).set(data).where(eq(homePageSections.sectionKey, sectionKey));
    } else {
      await db.insert(homePageSections).values(input as InsertHomePageSection);
    }
    
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(homePageSections).where(eq(homePageSections.id, input.id));
    return { success: true };
  }),
});

// ============================================
// CASE STUDIES ROUTER
// ============================================
const caseStudiesRouter = router({
  list: publicProcedure.input(z.object({
    industry: z.string().optional(),
    featured: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    let results = await db.select().from(caseStudies).where(eq(caseStudies.isActive, "true")).orderBy(desc(caseStudies.publishedAt));
    
    if (input?.industry) {
      results = results.filter(c => c.industry === input.industry);
    }
    if (input?.featured) {
      results = results.filter(c => c.isFeatured === "true");
    }
    
    return results;
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(caseStudies).where(eq(caseStudies.slug, input.slug)).limit(1);
    return result[0] || null;
  }),

  // Admin operations
  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(caseStudies).orderBy(desc(caseStudies.createdAt));
  }),

  create: protectedProcedure.input(z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    slug: z.string(),
    clientName: z.string(),
    clientLogo: z.string().optional(),
    industry: z.string().optional(),
    challenge: z.string().optional(),
    challengeEn: z.string().optional(),
    solution: z.string().optional(),
    solutionEn: z.string().optional(),
    results: z.string().optional(),
    resultsEn: z.string().optional(),
    testimonial: z.string().optional(),
    testimonialEn: z.string().optional(),
    testimonialAuthor: z.string().optional(),
    testimonialPosition: z.string().optional(),
    image: z.string().optional(),
    gallery: z.string().optional(),
    videoUrl: z.string().optional(),
    productsUsed: z.string().optional(),
    metrics: z.string().optional(),
    sortOrder: z.number().optional(),
    isFeatured: z.enum(["true", "false"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(caseStudies).values({
      ...input,
      publishedAt: new Date(),
    } as InsertCaseStudy);
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    titleEn: z.string().optional(),
    slug: z.string().optional(),
    clientName: z.string().optional(),
    clientLogo: z.string().optional(),
    industry: z.string().optional(),
    challenge: z.string().optional(),
    challengeEn: z.string().optional(),
    solution: z.string().optional(),
    solutionEn: z.string().optional(),
    results: z.string().optional(),
    resultsEn: z.string().optional(),
    testimonial: z.string().optional(),
    testimonialEn: z.string().optional(),
    testimonialAuthor: z.string().optional(),
    testimonialPosition: z.string().optional(),
    image: z.string().optional(),
    gallery: z.string().optional(),
    videoUrl: z.string().optional(),
    productsUsed: z.string().optional(),
    metrics: z.string().optional(),
    sortOrder: z.number().optional(),
    isFeatured: z.enum(["true", "false"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    await db.update(caseStudies).set(data).where(eq(caseStudies.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(caseStudies).where(eq(caseStudies.id, input.id));
    return { success: true };
  }),
});

// ============================================
// USERS ROUTER (Admin only)
// ============================================
const usersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Only admin can list users
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const db = await getDb();
    if (!db) return [];
    return db.select().from(users).orderBy(desc(users.createdAt));
  }),

  updateRole: protectedProcedure.input(z.object({
    userId: z.number(),
    role: z.enum(["user", "editor", "admin"]),
  })).mutation(async ({ ctx, input }) => {
    // Only admin can update roles
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    // Prevent self-role change
    if (ctx.user?.id === input.userId) {
      throw new Error("Cannot change your own role");
    }
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
    return { success: true };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const db = await getDb();
    if (!db) return { total: 0, admin: 0, editor: 0, user: 0 };
    const allUsers = await db.select().from(users);
    return {
      total: allUsers.length,
      admin: allUsers.filter(u => u.role === "admin").length,
      editor: allUsers.filter(u => u.role === "editor").length,
      user: allUsers.filter(u => u.role === "user").length,
    };
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
  newsletter: newsletterRouter,
  faq: faqRouter,
  homePage: homePageRouter,
  caseStudies: caseStudiesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
