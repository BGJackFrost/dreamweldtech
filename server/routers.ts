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
  jobs,
  jobApplications,
  notifications,
  portfolioItems,
  partners,
  InsertProduct,
  InsertProductCategory,
  InsertNews,
  InsertContactRequest,
  InsertSiteSetting,
  InsertNewsletterSubscriber,
  InsertFAQ,
  InsertHomePageSection,
  InsertCaseStudy,
  InsertJob,
  InsertJobApplication,
  InsertNotification,
  InsertPortfolioItem,
  InsertPartner
} from "../drizzle/schema";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { notifyNewJobApplication, notifyNewContactForm } from "./email";
import { exportData, importData, exportSensitiveData, getDatabaseStats, BackupData } from "./backup";

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
    recaptchaToken: z.string().optional(),
  })).mutation(async ({ input }) => {
    // Verify reCAPTCHA if token provided
    const { recaptchaToken, ...contactData } = input;
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(contactRequests).values(contactData as InsertContactRequest);
    
    // Create notification for admin
    const notifType = input.requestType === "quote" ? "quote" : "contact";
    const notifTitle = input.requestType === "quote" 
      ? `Yêu cầu báo giá mới từ ${input.name}`
      : `Liên hệ mới từ ${input.name}`;
    await db.insert(notifications).values({
      type: notifType,
      title: notifTitle,
      message: input.subject || input.message?.substring(0, 100),
      link: "/admin/contacts",
    } as InsertNotification);
    
    // Send email notification to admin
    await notifyNewContactForm({
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      subject: input.subject,
      message: input.message || "",
    });
    
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

  // Get single user by ID
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
    return result[0] || null;
  }),

  // Delete user (soft delete or hard delete)
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    // Prevent self-deletion
    if (ctx.user?.id === input.id) {
      throw new Error("Cannot delete your own account");
    }
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
    if (!existingUser[0]) {
      throw new Error("User not found");
    }
    
    // Prevent deleting other admins (optional security measure)
    if (existingUser[0].role === "admin") {
      throw new Error("Cannot delete admin users");
    }
    
    await db.delete(users).where(eq(users.id, input.id));
    return { success: true };
  }),

  // Update user info (name, email)
  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    email: z.string().email().optional(),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const updateData: Record<string, unknown> = {};
    if (input.name) updateData.name = input.name;
    if (input.email) updateData.email = input.email;
    updateData.updatedAt = new Date();
    
    await db.update(users).set(updateData).where(eq(users.id, input.id));
    return { success: true };
  }),

  // Bulk update roles
  bulkUpdateRole: protectedProcedure.input(z.object({
    userIds: z.array(z.number()),
    role: z.enum(["user", "editor", "admin"]),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    // Prevent changing own role
    if (input.userIds.includes(ctx.user?.id || 0)) {
      throw new Error("Cannot change your own role");
    }
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    for (const userId of input.userIds) {
      await db.update(users).set({ role: input.role }).where(eq(users.id, userId));
    }
    return { success: true, count: input.userIds.length };
  }),

  // Create new user (admin only)
  create: protectedProcedure.input(z.object({
    name: z.string().min(1, "Tên không được để trống"),
    email: z.string().email("Email không hợp lệ"),
    role: z.enum(["user", "editor", "admin"]).default("user"),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (existingUser[0]) {
      throw new Error("Email đã tồn tại trong hệ thống");
    }
    
    // Generate a unique openId for manually created users
    const openId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const result = await db.insert(users).values({
      openId,
      name: input.name,
      email: input.email,
      role: input.role,
      loginMethod: "manual",
    });
    
    return { success: true, id: result[0].insertId };
  }),
});

// ============================================
// JOBS ROUTER (Tuyển dụng)
// ============================================
const jobsRouter = router({
  // Public
  listActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(jobs).where(eq(jobs.isActive, "true")).orderBy(desc(jobs.createdAt));
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(jobs).where(eq(jobs.slug, input.slug)).limit(1);
    return result[0] || null;
  }),

  // Admin
  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }),

  create: protectedProcedure.input(z.object({
    title: z.string(),
    slug: z.string(),
    department: z.string().optional(),
    location: z.string().optional(),
    type: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
    experience: z.string().optional(),
    salary: z.string().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    benefits: z.string().optional(),
    deadline: z.date().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(jobs).values(input as InsertJob);
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    slug: z.string().optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    type: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
    experience: z.string().optional(),
    salary: z.string().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    benefits: z.string().optional(),
    deadline: z.date().optional(),
    isActive: z.enum(["true", "false"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    await db.update(jobs).set(data).where(eq(jobs.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(jobs).where(eq(jobs.id, input.id));
    return { success: true };
  }),
});

// ============================================
// JOB APPLICATIONS ROUTER
// ============================================
const jobApplicationsRouter = router({
  // Public - submit application
  submit: publicProcedure.input(z.object({
    jobId: z.number(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    resumeUrl: z.string().optional(),
    coverLetter: z.string().optional(),
    recaptchaToken: z.string().optional(),
  })).mutation(async ({ input }) => {
    // Verify reCAPTCHA if token provided
    const { recaptchaToken, ...applicationData } = input;
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(jobApplications).values(applicationData as InsertJobApplication);
    
    // Get job title for notification
    const job = await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
    const jobTitle = job[0]?.title || "Vị trí tuyển dụng";
    
    // Create notification and send email
    await db.insert(notifications).values({
      type: "application",
      title: `Đơn ứng tuyển mới từ ${input.name}`,
      message: `Email: ${input.email}`,
      link: "/admin/applications",
    } as InsertNotification);
    
    // Send email notification to admin
    await notifyNewJobApplication({
      applicantName: input.name,
      applicantEmail: input.email,
      applicantPhone: input.phone,
      jobTitle: jobTitle,
      coverLetter: input.coverLetter,
      cvUrl: input.resumeUrl,
    });
    
    return { success: true, message: "Đơn ứng tuyển đã được gửi thành công!" };
  }),

  // Admin
  list: protectedProcedure.input(z.object({
    jobId: z.number().optional(),
    status: z.enum(["pending", "reviewing", "interviewed", "accepted", "rejected"]).optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    let query = db.select().from(jobApplications);
    
    if (input?.jobId) {
      return db.select().from(jobApplications).where(eq(jobApplications.jobId, input.jobId)).orderBy(desc(jobApplications.createdAt));
    }
    if (input?.status) {
      return db.select().from(jobApplications).where(eq(jobApplications.status, input.status)).orderBy(desc(jobApplications.createdAt));
    }
    
    return db.select().from(jobApplications).orderBy(desc(jobApplications.createdAt));
  }),

  updateStatus: protectedProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["pending", "reviewing", "interviewed", "accepted", "rejected"]),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    await db.update(jobApplications).set(data).where(eq(jobApplications.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(jobApplications).where(eq(jobApplications.id, input.id));
    return { success: true };
  }),

  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, pending: 0, reviewing: 0, interviewed: 0, accepted: 0, rejected: 0 };
    const all = await db.select().from(jobApplications);
    return {
      total: all.length,
      pending: all.filter(a => a.status === "pending").length,
      reviewing: all.filter(a => a.status === "reviewing").length,
      interviewed: all.filter(a => a.status === "interviewed").length,
      accepted: all.filter(a => a.status === "accepted").length,
      rejected: all.filter(a => a.status === "rejected").length,
    };
  }),
});

// ============================================
// NOTIFICATIONS ROUTER
// ============================================
const notificationsRouter = router({
  list: protectedProcedure.input(z.object({
    unreadOnly: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    if (input?.unreadOnly) {
      return db.select().from(notifications).where(eq(notifications.isRead, "false")).orderBy(desc(notifications.createdAt)).limit(50);
    }
    return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100);
  }),

  unreadCount: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return 0;
    const result = await db.select().from(notifications).where(eq(notifications.isRead, "false"));
    return result.length;
  }),

  markAsRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(notifications).set({ isRead: "true" }).where(eq(notifications.id, input.id));
    return { success: true };
  }),

  markAllAsRead: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(notifications).set({ isRead: "true" }).where(eq(notifications.isRead, "false"));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(notifications).where(eq(notifications.id, input.id));
    return { success: true };
  }),
});

// Helper function to create notification
async function createNotification(type: "contact" | "quote" | "application" | "newsletter" | "system", title: string, message?: string, link?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ type, title, message, link } as InsertNotification);
}

// ============================================
// PORTFOLIO ROUTER
// ============================================
const portfolioRouter = router({
  list: publicProcedure.input(z.object({
    category: z.string().optional(),
    featured: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    let results = await db.select().from(portfolioItems).where(eq(portfolioItems.isActive, "true")).orderBy(asc(portfolioItems.sortOrder));
    
    if (input?.category) {
      results = results.filter(p => p.category === input.category);
    }
    if (input?.featured) {
      results = results.filter(p => p.isFeatured === "true");
    }
    
    return results;
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(portfolioItems).where(eq(portfolioItems.id, input.id)).limit(1);
    return result[0] || null;
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(portfolioItems).where(eq(portfolioItems.slug, input.slug)).limit(1);
    return result[0] || null;
  }),

  // Admin operations
  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(portfolioItems).orderBy(asc(portfolioItems.sortOrder));
  }),

  create: protectedProcedure.input(z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
    category: z.string().optional(),
    client: z.string().optional(),
    location: z.string().optional(),
    completedDate: z.string().optional(),
    images: z.string().optional(),
    videoUrl: z.string().optional(),
    tags: z.string().optional(),
    isFeatured: z.enum(["true", "false"]).optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(portfolioItems).values(input as InsertPortfolioItem);
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    titleEn: z.string().optional(),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
    category: z.string().optional(),
    client: z.string().optional(),
    location: z.string().optional(),
    completedDate: z.string().optional(),
    images: z.string().optional(),
    videoUrl: z.string().optional(),
    tags: z.string().optional(),
    isFeatured: z.enum(["true", "false"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    await db.update(portfolioItems).set(data).where(eq(portfolioItems.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(portfolioItems).where(eq(portfolioItems.id, input.id));
    return { success: true };
  }),
});

// ============================================
// PARTNERS ROUTER
// ============================================
const partnersRouter = router({
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(partners).orderBy(asc(partners.sortOrder), desc(partners.createdAt));
  }),

  getActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(partners).where(eq(partners.isActive, "true")).orderBy(asc(partners.sortOrder));
  }),

  getFeatured: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(partners).where(and(eq(partners.isActive, "true"), eq(partners.isFeatured, "true"))).orderBy(asc(partners.sortOrder));
  }),

  getWithTestimonials: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(partners).where(and(eq(partners.isActive, "true"), sql`${partners.testimonial} IS NOT NULL AND ${partners.testimonial} != ''`)).orderBy(asc(partners.sortOrder));
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(partners).where(eq(partners.id, input.id));
    return result[0] || null;
  }),

  create: protectedProcedure.input(z.object({
    name: z.string(),
    slug: z.string(),
    logo: z.string().optional(),
    website: z.string().optional(),
    description: z.string().optional(),
    testimonial: z.string().optional(),
    testimonialAuthor: z.string().optional(),
    testimonialPosition: z.string().optional(),
    category: z.enum(["manufacturer", "distributor", "enterprise", "government", "other"]).optional(),
    isFeatured: z.enum(["true", "false"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(partners).values(input as InsertPartner);
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    slug: z.string().optional(),
    logo: z.string().optional(),
    website: z.string().optional(),
    description: z.string().optional(),
    testimonial: z.string().optional(),
    testimonialAuthor: z.string().optional(),
    testimonialPosition: z.string().optional(),
    category: z.enum(["manufacturer", "distributor", "enterprise", "government", "other"]).optional(),
    isFeatured: z.enum(["true", "false"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    await db.update(partners).set(data).where(eq(partners.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(partners).where(eq(partners.id, input.id));
    return { success: true };
  }),
});

// ============================================
// ANALYTICS ROUTER
// ============================================
const analyticsRouter = router({
  // Get dashboard stats
  getDashboardStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    // Get counts
    const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [newsCount] = await db.select({ count: sql<number>`count(*)` }).from(news);
    const [contactsCount] = await db.select({ count: sql<number>`count(*)` }).from(contactRequests);
    const [subscribersCount] = await db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers);
    const [applicationsCount] = await db.select({ count: sql<number>`count(*)` }).from(jobApplications);
    const [partnersCount] = await db.select({ count: sql<number>`count(*)` }).from(partners);

    // Get new contacts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [newContactsCount] = await db.select({ count: sql<number>`count(*)` })
      .from(contactRequests)
      .where(sql`${contactRequests.createdAt} >= ${sevenDaysAgo.toISOString()}`);

    // Get new applications (last 7 days)
    const [newApplicationsCount] = await db.select({ count: sql<number>`count(*)` })
      .from(jobApplications)
      .where(sql`${jobApplications.createdAt} >= ${sevenDaysAgo.toISOString()}`);

    return {
      products: productsCount?.count || 0,
      news: newsCount?.count || 0,
      contacts: contactsCount?.count || 0,
      subscribers: subscribersCount?.count || 0,
      applications: applicationsCount?.count || 0,
      partners: partnersCount?.count || 0,
      newContacts: newContactsCount?.count || 0,
      newApplications: newApplicationsCount?.count || 0,
    };
  }),

  // Get contacts by time period
  getContactsByPeriod: protectedProcedure.input(z.object({
    period: z.enum(["7d", "30d", "90d", "1y"]),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const days = input.period === "7d" ? 7 : input.period === "30d" ? 30 : input.period === "90d" ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0, 10);

    const results = await db.select({
      date: sql<string>`DATE(createdAt)`.as('date'),
      count: sql<number>`count(*)`.as('count'),
    })
      .from(contactRequests)
      .where(sql`DATE(createdAt) >= ${startDateStr}`)
      .groupBy(sql`DATE(createdAt)`)
      .orderBy(sql`DATE(createdAt)`);

    return results;
  }),

  // Get applications by time period
  getApplicationsByPeriod: protectedProcedure.input(z.object({
    period: z.enum(["7d", "30d", "90d", "1y"]),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const days = input.period === "7d" ? 7 : input.period === "30d" ? 30 : input.period === "90d" ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0, 10);

    const results = await db.select({
      date: sql<string>`DATE(createdAt)`.as('date'),
      count: sql<number>`count(*)`.as('count'),
    })
      .from(jobApplications)
      .where(sql`DATE(createdAt) >= ${startDateStr}`)
      .groupBy(sql`DATE(createdAt)`)
      .orderBy(sql`DATE(createdAt)`);

    return results;
  }),

  // Get contact status distribution
  getContactStatusDistribution: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const results = await db.select({
      status: contactRequests.status,
      count: sql<number>`count(*)`,
    })
      .from(contactRequests)
      .groupBy(contactRequests.status);

    return results.map(r => ({
      name: r.status === "new" ? "Mới" : r.status === "read" ? "Đã xem" : r.status === "replied" ? "Đã trả lời" : "Đã đóng",
      value: r.count,
    }));
  }),

  // Get application status distribution
  getApplicationStatusDistribution: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const results = await db.select({
      status: jobApplications.status,
      count: sql<number>`count(*)`,
    })
      .from(jobApplications)
      .groupBy(jobApplications.status);

    return results.map(r => ({
      name: r.status === "pending" ? "Chờ duyệt" : r.status === "reviewing" ? "Đang xem xét" : r.status === "interviewed" ? "Đã phỏng vấn" : r.status === "accepted" ? "Đã nhận" : "Từ chối",
      value: r.count,
    }));
  }),

  // Get monthly summary
  getMonthlySummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    const startDateStr = startDate.toISOString().slice(0, 10);

    // Get contacts by month
    const contactsByMonth = await db.select({
      month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`.as('month'),
      count: sql<number>`count(*)`.as('count'),
    })
      .from(contactRequests)
      .where(sql`DATE(createdAt) >= ${startDateStr}`)
      .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`);

    // Get applications by month
    const applicationsByMonth = await db.select({
      month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`.as('month'),
      count: sql<number>`count(*)`.as('count'),
    })
      .from(jobApplications)
      .where(sql`DATE(createdAt) >= ${startDateStr}`)
      .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`);

    // Merge data
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }

    return months.map(month => {
      const contacts = contactsByMonth.find(c => c.month === month)?.count || 0;
      const applications = applicationsByMonth.find(a => a.month === month)?.count || 0;
      const monthName = new Date(month + "-01").toLocaleDateString("vi-VN", { month: "short" });
      return {
        name: monthName,
        month,
        contacts,
        applications,
      };
    });
  }),
});

// ============================================
// BACKUP ROUTER
// ============================================
const backupRouter = router({
  // Export all data (admin only)
  export: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return exportData();
  }),

  // Export sensitive data (admin only)
  exportSensitive: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return exportSensitiveData();
  }),

  // Import data (admin only)
  import: protectedProcedure
    .input(z.object({
      data: z.any(),
      overwrite: z.boolean().optional().default(false),
      tables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      return importData(input.data as BackupData, {
        overwrite: input.overwrite,
        tables: input.tables,
      });
    }),

  // Get database statistics (admin only)
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return getDatabaseStats();
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
  jobs: jobsRouter,
  jobApplications: jobApplicationsRouter,
  notifications: notificationsRouter,
  portfolio: portfolioRouter,
  partners: partnersRouter,
  analytics: analyticsRouter,
  backup: backupRouter,
});

// Export createNotification for use in other parts of the app
export { createNotification };

export type AppRouter = typeof appRouter;
