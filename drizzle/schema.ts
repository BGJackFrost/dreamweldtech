import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "editor", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// PRODUCT CATEGORIES
// ============================================
export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  sortOrder: int("sortOrder").default(0),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

// ============================================
// PRODUCTS
// ============================================
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  shortDescription: text("shortDescription"),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  gallery: text("gallery"), // JSON array of image URLs
  specifications: text("specifications"), // JSON object for technical specs
  features: text("features"), // JSON array of features
  applications: text("applications"), // JSON array of applications
  brochureUrl: varchar("brochureUrl", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }),
  sortOrder: int("sortOrder").default(0),
  isFeatured: mysqlEnum("isFeatured", ["true", "false"]).default("false").notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============================================
// NEWS / BLOG
// ============================================
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  image: varchar("image", { length: 500 }),
  authorId: int("authorId"),
  category: varchar("category", { length: 100 }),
  tags: text("tags"), // JSON array of tags
  viewCount: int("viewCount").default(0),
  isPublished: mysqlEnum("isPublished", ["true", "false"]).default("false").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

// ============================================
// CONTACT REQUESTS / QUOTE REQUESTS
// ============================================
export const contactRequests = mysqlTable("contact_requests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  subject: varchar("subject", { length: 500 }),
  message: text("message"),
  productId: int("productId"), // If this is a quote request for a specific product
  requestType: mysqlEnum("requestType", ["contact", "quote", "support"]).default("contact").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContactRequest = typeof contactRequests.$inferSelect;
export type InsertContactRequest = typeof contactRequests.$inferInsert;

// ============================================
// SITE SETTINGS (for dynamic content management)
// ============================================
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  settingType: mysqlEnum("settingType", ["text", "html", "json", "image"]).default("text").notNull(),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

// ============================================
// NEWSLETTER SUBSCRIBERS
// ============================================
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  status: mysqlEnum("status", ["active", "unsubscribed"]).default("active").notNull(),
  source: varchar("source", { length: 100 }), // Where they subscribed from (homepage, footer, popup, etc.)
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// ============================================
// FAQ (Frequently Asked Questions)
// ============================================
export const faqs = mysqlTable("faqs", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),
  questionEn: text("questionEn"), // English version
  answer: text("answer").notNull(),
  answerEn: text("answerEn"), // English version
  category: varchar("category", { length: 100 }), // e.g., "products", "shipping", "warranty", "general"
  sortOrder: int("sortOrder").default(0),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FAQ = typeof faqs.$inferSelect;
export type InsertFAQ = typeof faqs.$inferInsert;

// ============================================
// HOME PAGE SECTIONS (for dynamic home page management)
// ============================================
export const homePageSections = mysqlTable("home_page_sections", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("sectionKey", { length: 100 }).notNull().unique(), // e.g., "hero", "about", "products", "solutions", "cta"
  title: varchar("title", { length: 500 }),
  titleEn: varchar("titleEn", { length: 500 }),
  subtitle: text("subtitle"),
  subtitleEn: text("subtitleEn"),
  content: text("content"), // JSON or HTML content
  contentEn: text("contentEn"),
  image: varchar("image", { length: 500 }),
  backgroundImage: varchar("backgroundImage", { length: 500 }),
  buttonText: varchar("buttonText", { length: 100 }),
  buttonTextEn: varchar("buttonTextEn", { length: 100 }),
  buttonLink: varchar("buttonLink", { length: 500 }),
  sortOrder: int("sortOrder").default(0),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HomePageSection = typeof homePageSections.$inferSelect;
export type InsertHomePageSection = typeof homePageSections.$inferInsert;

// ============================================
// CASE STUDIES / PROJECTS
// ============================================
export const caseStudies = mysqlTable("case_studies", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  titleEn: varchar("titleEn", { length: 500 }),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientLogo: varchar("clientLogo", { length: 500 }),
  industry: varchar("industry", { length: 100 }), // e.g., "automotive", "aerospace", "electronics"
  challenge: text("challenge"), // Problem description
  challengeEn: text("challengeEn"),
  solution: text("solution"), // How Dreamweldtech solved it
  solutionEn: text("solutionEn"),
  results: text("results"), // Outcomes and benefits
  resultsEn: text("resultsEn"),
  testimonial: text("testimonial"), // Client quote
  testimonialEn: text("testimonialEn"),
  testimonialAuthor: varchar("testimonialAuthor", { length: 255 }),
  testimonialPosition: varchar("testimonialPosition", { length: 255 }),
  image: varchar("image", { length: 500 }), // Main image
  gallery: text("gallery"), // JSON array of image URLs
  videoUrl: varchar("videoUrl", { length: 500 }),
  productsUsed: text("productsUsed"), // JSON array of product IDs
  metrics: text("metrics"), // JSON object with key metrics (e.g., {"efficiency": "+30%", "cost_savings": "25%"})
  sortOrder: int("sortOrder").default(0),
  isFeatured: mysqlEnum("isFeatured", ["true", "false"]).default("false").notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CaseStudy = typeof caseStudies.$inferSelect;
export type InsertCaseStudy = typeof caseStudies.$inferInsert;

// ============================================
// JOBS (Tuyển dụng)
// ============================================
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  department: varchar("department", { length: 100 }),
  location: varchar("location", { length: 255 }),
  type: mysqlEnum("type", ["full-time", "part-time", "contract", "internship"]).default("full-time"),
  experience: varchar("experience", { length: 100 }),
  salary: varchar("salary", { length: 100 }),
  description: text("description"),
  requirements: text("requirements"),
  benefits: text("benefits"),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  deadline: timestamp("deadline"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// ============================================
// JOB APPLICATIONS (Đơn ứng tuyển)
// ============================================
export const jobApplications = mysqlTable("job_applications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  resumeUrl: varchar("resumeUrl", { length: 500 }),
  coverLetter: text("coverLetter"),
  status: mysqlEnum("status", ["pending", "reviewing", "interviewed", "accepted", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = typeof jobApplications.$inferInsert;
