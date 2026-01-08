import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex, bigint, decimal } from "drizzle-orm/mysql-core";

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
  /** Username for local login (optional, used when not using OAuth) */
  username: varchar("username", { length: 100 }).unique(),
  /** Password hash for local login (bcrypt) */
  passwordHash: varchar("passwordHash", { length: 255 }),
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

// ============================================
// NOTIFICATIONS (Thông báo)
// ============================================
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["contact", "quote", "application", "newsletter", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  link: varchar("link", { length: 500 }),
  isRead: mysqlEnum("isRead", ["true", "false"]).default("false").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================
// PORTFOLIO/GALLERY (Dự án)
// ============================================
export const portfolioItems = mysqlTable("portfolio_items", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleEn: varchar("titleEn", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  descriptionEn: text("descriptionEn"),
  category: varchar("category", { length: 100 }),
  client: varchar("client", { length: 255 }),
  location: varchar("location", { length: 255 }),
  completedDate: varchar("completedDate", { length: 50 }),
  images: text("images"), // JSON array of image URLs
  videoUrl: varchar("videoUrl", { length: 500 }),
  tags: varchar("tags", { length: 500 }),
  isFeatured: mysqlEnum("isFeatured", ["true", "false"]).default("false").notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;

// ============================================
// PARTNERS / CLIENTS
// ============================================
export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logo: varchar("logo", { length: 500 }),
  website: varchar("website", { length: 500 }),
  description: text("description"),
  testimonial: text("testimonial"),
  testimonialAuthor: varchar("testimonialAuthor", { length: 255 }),
  testimonialPosition: varchar("testimonialPosition", { length: 255 }),
  category: mysqlEnum("category", ["manufacturer", "distributor", "enterprise", "government", "other"]).default("enterprise"),
  isFeatured: mysqlEnum("isFeatured", ["true", "false"]).default("false"),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

// ============================================
// BANNERS / SLIDERS
// ============================================
export const banners = mysqlTable("banners", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  image: varchar("image", { length: 500 }).notNull(),
  mobileImage: varchar("mobileImage", { length: 500 }),
  link: varchar("link", { length: 500 }),
  buttonText: varchar("buttonText", { length: 100 }),
  buttonLink: varchar("buttonLink", { length: 500 }),
  position: mysqlEnum("position", ["hero", "promo", "sidebar", "footer"]).default("hero").notNull(),
  slideEffect: mysqlEnum("slideEffect", ["fade", "slide", "zoom"]).default("fade").notNull(),
  sortOrder: int("sortOrder").default(0),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = typeof banners.$inferInsert;


// ============================================
// ADMIN ACTIVITY LOG (Audit Trail)
// ============================================
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", ["create", "update", "delete", "view", "export", "import", "login", "logout"]).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(), // "product", "news", "user", "settings", etc.
  entityId: int("entityId"),
  entityName: varchar("entityName", { length: 255 }), // Name of the entity (e.g., product name)
  oldValues: text("oldValues"), // JSON object with previous values
  newValues: text("newValues"), // JSON object with new values
  changes: text("changes"), // JSON array of what changed
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["success", "failed"]).default("success").notNull(),
  errorMessage: text("errorMessage"), // If status is failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ============================================
// ADMIN ROLES & PERMISSIONS
// ============================================
export const adminRoles = mysqlTable("admin_roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // "super_admin", "editor", "viewer"
  description: text("description"),
  permissions: text("permissions"), // JSON array of permission strings
  isSystem: mysqlEnum("isSystem", ["true", "false"]).default("false").notNull(), // System roles cannot be deleted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminRole = typeof adminRoles.$inferSelect;
export type InsertAdminRole = typeof adminRoles.$inferInsert;

// Update users table to support admin roles
export const userAdminRoles = mysqlTable("user_admin_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  roleId: int("roleId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  assignedBy: int("assignedBy"), // User ID who assigned this role
});

export type UserAdminRole = typeof userAdminRoles.$inferSelect;
export type InsertUserAdminRole = typeof userAdminRoles.$inferInsert;

// ============================================
// NOTIFICATION CENTER
// ============================================
export const notificationCenter = mysqlTable("notification_center", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null = system notification for all admins
  type: mysqlEnum("type", ["contact", "quote", "application", "newsletter", "system", "product", "news"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  icon: varchar("icon", { length: 100 }), // Icon name from lucide-react
  link: varchar("link", { length: 500 }), // Link to related resource
  relatedEntityType: varchar("relatedEntityType", { length: 100 }), // "contact", "job_application", "newsletter_subscriber"
  relatedEntityId: int("relatedEntityId"), // ID of the related entity
  isRead: mysqlEnum("isRead", ["true", "false"]).default("false").notNull(),
  readAt: timestamp("readAt"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  category: varchar("category", { length: 100 }), // "new_contact", "new_application", "new_subscriber", "system_alert"
  metadata: text("metadata"), // JSON object with additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Auto-delete old notifications
});

export type NotificationCenterItem = typeof notificationCenter.$inferSelect;
export type InsertNotificationCenterItem = typeof notificationCenter.$inferInsert;

// Notification preferences per user
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // "contact", "application", "newsletter", "system"
  emailNotification: mysqlEnum("emailNotification", ["true", "false"]).default("true").notNull(),
  inAppNotification: mysqlEnum("inAppNotification", ["true", "false"]).default("true").notNull(),
  pushNotification: mysqlEnum("pushNotification", ["true", "false"]).default("false").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;


// ============================================
// EMAIL DIGEST SETTINGS
// ============================================
export const emailDigestSettings = mysqlTable("email_digest_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  isEnabled: mysqlEnum("isEnabled", ["true", "false"]).default("false").notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).default("daily").notNull(),
  sendTime: varchar("sendTime", { length: 5 }).default("09:00").notNull(), // HH:mm format
  sendDay: int("sendDay").default(1), // 1-7 for weekly (Monday=1), 1-31 for monthly
  timezone: varchar("timezone", { length: 50 }).default("Asia/Ho_Chi_Minh").notNull(),
  includeContacts: mysqlEnum("includeContacts", ["true", "false"]).default("true").notNull(),
  includeApplications: mysqlEnum("includeApplications", ["true", "false"]).default("true").notNull(),
  includeNewsletter: mysqlEnum("includeNewsletter", ["true", "false"]).default("true").notNull(),
  includeSystem: mysqlEnum("includeSystem", ["true", "false"]).default("true").notNull(),
  lastSentAt: timestamp("lastSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailDigestSetting = typeof emailDigestSettings.$inferSelect;
export type InsertEmailDigestSetting = typeof emailDigestSettings.$inferInsert;

// ============================================
// DND SCHEDULE (Do Not Disturb Schedule)
// ============================================
export const dndSchedule = mysqlTable("dnd_schedule", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  isEnabled: mysqlEnum("isEnabled", ["true", "false"]).default("true").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:mm format (e.g., "22:00")
  endTime: varchar("endTime", { length: 5 }).notNull(), // HH:mm format (e.g., "08:00")
  timezone: varchar("timezone", { length: 50 }).default("Asia/Ho_Chi_Minh").notNull(),
  daysOfWeek: varchar("daysOfWeek", { length: 20 }).default("1,2,3,4,5,6,7").notNull(), // Comma-separated: 1=Mon, 7=Sun
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DndSchedule = typeof dndSchedule.$inferSelect;
export type InsertDndSchedule = typeof dndSchedule.$inferInsert;

// ============================================
// PUSH NOTIFICATION SUBSCRIPTIONS
// ============================================
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(), // Public key
  auth: varchar("auth", { length: 255 }).notNull(), // Auth secret
  userAgent: varchar("userAgent", { length: 500 }),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// ============================================
// EMAIL DIGEST LOG (Track sent digests)
// ============================================
export const emailDigestLog = mysqlTable("email_digest_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  frequency: varchar("frequency", { length: 20 }).notNull(),
  contactsCount: int("contactsCount").default(0),
  applicationsCount: int("applicationsCount").default(0),
  newsletterCount: int("newsletterCount").default(0),
  systemCount: int("systemCount").default(0),
  status: mysqlEnum("status", ["sent", "failed", "skipped"]).default("sent").notNull(),
  errorMessage: text("errorMessage"),
});

export type EmailDigestLogEntry = typeof emailDigestLog.$inferSelect;
export type InsertEmailDigestLogEntry = typeof emailDigestLog.$inferInsert;


// ============================================
// USER PREFERENCES (Language, Theme, etc.)
// ============================================
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  language: mysqlEnum("language", ["vi", "en", "ja", "zh"]).default("vi").notNull(),
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("system").notNull(),
  timezone: varchar("timezone", { length: 100 }).default("Asia/Ho_Chi_Minh"),
  dateFormat: varchar("dateFormat", { length: 50 }).default("DD/MM/YYYY"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;


// ============================================
// CUSTOM TRANSLATIONS (Database-backed i18n)
// ============================================
export const customTranslations = mysqlTable("custom_translations", {
  id: int("id").autoincrement().primaryKey(),
  /** Translation key path, e.g., "admin.dashboard.title" or "public.home.hero.title" */
  key: varchar("key", { length: 255 }).notNull(),
  /** Language code: vi, en, ja, zh */
  language: varchar("language", { length: 10 }).notNull(),
  /** The translated value */
  value: text("value").notNull(),
  /** Category for grouping: admin, public, common */
  category: varchar("category", { length: 50 }).default("common"),
  /** Description/context for translators */
  description: text("description"),
  /** Who last modified this translation */
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  keyLangUnique: uniqueIndex("key_lang_unique").on(table.key, table.language),
}));

export type CustomTranslation = typeof customTranslations.$inferSelect;
export type InsertCustomTranslation = typeof customTranslations.$inferInsert;


// ============================================
// METRICS HISTORY - Server monitoring metrics
// ============================================
export const metricsHistory = mysqlTable("metrics_history", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  // System metrics
  cpuUsage: int("cpuUsage").notNull(), // percentage
  memoryUsage: int("memoryUsage").notNull(), // percentage
  memoryTotal: bigint("memoryTotal", { mode: "number" }).notNull(), // bytes
  memoryUsed: bigint("memoryUsed", { mode: "number" }).notNull(), // bytes
  diskUsage: int("diskUsage"), // percentage (optional)
  
  // Load average
  loadAvg1m: decimal("loadAvg1m", { precision: 5, scale: 2 }),
  loadAvg5m: decimal("loadAvg5m", { precision: 5, scale: 2 }),
  loadAvg15m: decimal("loadAvg15m", { precision: 5, scale: 2 }),
  
  // Application metrics
  totalRequests: int("totalRequests").default(0),
  errorCount: int("errorCount").default(0),
  errorRate: decimal("errorRate", { precision: 5, scale: 2 }).default("0"),
  avgResponseTime: int("avgResponseTime").default(0), // ms
  requestsPerMinute: int("requestsPerMinute").default(0),
  
  // Server info
  hostname: varchar("hostname", { length: 255 }),
  uptime: bigint("uptime", { mode: "number" }), // seconds
  
  // Aggregation type
  aggregationType: mysqlEnum("aggregationType", ["raw", "hourly", "daily", "weekly", "monthly"]).default("raw").notNull(),
});

export type MetricsHistory = typeof metricsHistory.$inferSelect;
export type InsertMetricsHistory = typeof metricsHistory.$inferInsert;


// ============================================
// ALERT THRESHOLDS - Customizable alert thresholds
// ============================================
export const alertThresholds = mysqlTable("alert_thresholds", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Metric name: cpu, memory, disk, responseTime, errorRate */
  metricName: varchar("metricName", { length: 50 }).notNull().unique(),
  
  /** Warning threshold (yellow alert) */
  warningThreshold: int("warningThreshold").notNull(),
  
  /** Critical threshold (red alert, triggers notifications) */
  criticalThreshold: int("criticalThreshold").notNull(),
  
  /** Unit for display: %, ms, etc. */
  unit: varchar("unit", { length: 10 }).default("%"),
  
  /** Description of what this metric measures */
  description: text("description"),
  
  /** Whether this alert is enabled */
  isEnabled: mysqlEnum("isEnabled", ["true", "false"]).default("true").notNull(),
  
  /** Cooldown period in minutes before sending another alert */
  cooldownMinutes: int("cooldownMinutes").default(15),
  
  /** Last time an alert was sent for this metric */
  lastAlertAt: timestamp("lastAlertAt"),
  
  /** Who last modified this threshold */
  updatedBy: int("updatedBy"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type InsertAlertThreshold = typeof alertThresholds.$inferInsert;


// ============================================
// SCHEDULED REPORTS - Automated performance reports
// ============================================
export const scheduledReports = mysqlTable("scheduled_reports", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Report name for identification */
  name: varchar("name", { length: 255 }).notNull(),
  
  /** Report type: daily, weekly, monthly */
  reportType: mysqlEnum("reportType", ["daily", "weekly", "monthly"]).default("weekly").notNull(),
  
  /** Day of week for weekly reports (0=Sunday, 1=Monday, etc.) */
  dayOfWeek: int("dayOfWeek").default(1), // Monday
  
  /** Day of month for monthly reports (1-28) */
  dayOfMonth: int("dayOfMonth").default(1),
  
  /** Hour to send report (0-23) */
  sendHour: int("sendHour").default(9), // 9 AM
  
  /** Timezone for scheduling */
  timezone: varchar("timezone", { length: 50 }).default("Asia/Ho_Chi_Minh"),
  
  /** Recipients (comma-separated emails) */
  recipients: text("recipients").notNull(),
  
  /** Include metrics: cpu, memory, responseTime, errorRate, uptime */
  includeMetrics: varchar("includeMetrics", { length: 500 }),
  
  /** Include period comparison (vs previous period) */
  includePeriodComparison: mysqlEnum("includePeriodComparison", ["true", "false"]).default("true"),
  
  /** Include charts as images */
  includeCharts: mysqlEnum("includeCharts", ["true", "false"]).default("true"),
  
  /** Whether this report is enabled */
  isEnabled: mysqlEnum("isEnabled", ["true", "false"]).default("true").notNull(),
  
  /** Last time report was sent */
  lastSentAt: timestamp("lastSentAt"),
  
  /** Next scheduled send time */
  nextSendAt: timestamp("nextSendAt"),
  
  /** Created by user */
  createdBy: int("createdBy"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;


// ============================================
// UPTIME HISTORY - Track uptime/downtime events
// ============================================
export const uptimeHistory = mysqlTable("uptime_history", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Timestamp of the check */
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  /** Status: up, down, degraded */
  status: mysqlEnum("status", ["up", "down", "degraded"]).default("up").notNull(),
  
  /** Response time in ms (null if down) */
  responseTime: int("responseTime"),
  
  /** HTTP status code (null if connection failed) */
  statusCode: int("statusCode"),
  
  /** Error message if any */
  errorMessage: text("errorMessage"),
  
  /** Check type: http, database, custom */
  checkType: varchar("checkType", { length: 50 }).default("http"),
  
  /** Endpoint or service name being checked */
  endpoint: varchar("endpoint", { length: 255 }).default("/api/health"),
  
  /** Duration of downtime in seconds (calculated when status changes from down to up) */
  downtimeDuration: int("downtimeDuration"),
  
  /** Year-month for aggregation (YYYY-MM format) */
  yearMonth: varchar("yearMonth", { length: 7 }),
});

export type UptimeHistory = typeof uptimeHistory.$inferSelect;
export type InsertUptimeHistory = typeof uptimeHistory.$inferInsert;


// ============================================
// UPTIME MONTHLY STATS - Aggregated monthly statistics
// ============================================
export const uptimeMonthlyStats = mysqlTable("uptime_monthly_stats", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Year-month (YYYY-MM format) */
  yearMonth: varchar("yearMonth", { length: 7 }).notNull().unique(),
  
  /** Total number of checks */
  totalChecks: int("totalChecks").default(0),
  
  /** Number of successful checks (up) */
  successfulChecks: int("successfulChecks").default(0),
  
  /** Number of failed checks (down) */
  failedChecks: int("failedChecks").default(0),
  
  /** Number of degraded checks */
  degradedChecks: int("degradedChecks").default(0),
  
  /** Availability percentage (0-100) */
  availabilityPercentage: decimal("availabilityPercentage", { precision: 5, scale: 2 }).default("100.00"),
  
  /** Average response time in ms */
  avgResponseTime: int("avgResponseTime").default(0),
  
  /** Max response time in ms */
  maxResponseTime: int("maxResponseTime").default(0),
  
  /** Min response time in ms */
  minResponseTime: int("minResponseTime").default(0),
  
  /** Total downtime in seconds */
  totalDowntimeSeconds: int("totalDowntimeSeconds").default(0),
  
  /** Number of incidents (status changed to down) */
  incidentCount: int("incidentCount").default(0),
  
  /** Mean Time To Recovery in seconds */
  mttr: int("mttr").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UptimeMonthlyStats = typeof uptimeMonthlyStats.$inferSelect;
export type InsertUptimeMonthlyStats = typeof uptimeMonthlyStats.$inferInsert;


// ============================================
// ENDPOINT METRICS - Track API endpoint response times
// ============================================
export const endpointMetrics = mysqlTable("endpoint_metrics", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Timestamp of the request */
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  /** API endpoint path (e.g., /api/trpc/products.list) */
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  
  /** HTTP method (GET, POST, PUT, DELETE) */
  method: varchar("method", { length: 10 }).notNull(),
  
  /** Response time in milliseconds */
  responseTime: int("responseTime").notNull(),
  
  /** HTTP status code */
  statusCode: int("statusCode").notNull(),
  
  /** Whether the request was successful (2xx) */
  isSuccess: mysqlEnum("isSuccess", ["true", "false"]).default("true").notNull(),
  
  /** Error message if any */
  errorMessage: text("errorMessage"),
  
  /** Request size in bytes */
  requestSize: int("requestSize"),
  
  /** Response size in bytes */
  responseSize: int("responseSize"),
  
  /** User agent */
  userAgent: varchar("userAgent", { length: 500 }),
  
  /** IP address (anonymized) */
  ipAddress: varchar("ipAddress", { length: 45 }),
  
  /** Year-month-day for aggregation (YYYY-MM-DD format) */
  dateKey: varchar("dateKey", { length: 10 }),
  
  /** Hour of day (0-23) for hourly analysis */
  hourOfDay: int("hourOfDay"),
});

export type EndpointMetric = typeof endpointMetrics.$inferSelect;
export type InsertEndpointMetric = typeof endpointMetrics.$inferInsert;


// ============================================
// ENDPOINT DAILY STATS - Aggregated daily statistics per endpoint
// ============================================
export const endpointDailyStats = mysqlTable("endpoint_daily_stats", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Date (YYYY-MM-DD format) */
  dateKey: varchar("dateKey", { length: 10 }).notNull(),
  
  /** API endpoint path */
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  
  /** HTTP method */
  method: varchar("method", { length: 10 }).notNull(),
  
  /** Total number of requests */
  totalRequests: int("totalRequests").default(0),
  
  /** Number of successful requests */
  successfulRequests: int("successfulRequests").default(0),
  
  /** Number of failed requests */
  failedRequests: int("failedRequests").default(0),
  
  /** Average response time in ms */
  avgResponseTime: int("avgResponseTime").default(0),
  
  /** Min response time in ms */
  minResponseTime: int("minResponseTime").default(0),
  
  /** Max response time in ms */
  maxResponseTime: int("maxResponseTime").default(0),
  
  /** P50 (median) response time in ms */
  p50ResponseTime: int("p50ResponseTime").default(0),
  
  /** P95 response time in ms */
  p95ResponseTime: int("p95ResponseTime").default(0),
  
  /** P99 response time in ms */
  p99ResponseTime: int("p99ResponseTime").default(0),
  
  /** Error rate percentage */
  errorRate: decimal("errorRate", { precision: 5, scale: 2 }).default("0.00"),
  
  /** Total request size in bytes */
  totalRequestSize: bigint("totalRequestSize", { mode: "number" }).default(0),
  
  /** Total response size in bytes */
  totalResponseSize: bigint("totalResponseSize", { mode: "number" }).default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EndpointDailyStat = typeof endpointDailyStats.$inferSelect;
export type InsertEndpointDailyStat = typeof endpointDailyStats.$inferInsert;


// ============================================
// RATE LIMIT CONFIG - Per-endpoint rate limiting configuration
// ============================================
export const rateLimitConfig = mysqlTable("rate_limit_config", {
  id: int("id").autoincrement().primaryKey(),
  
  /** API endpoint pattern (e.g., /api/trpc/products.*, /api/upload) */
  endpointPattern: varchar("endpointPattern", { length: 255 }).notNull().unique(),
  
  /** Maximum requests per window */
  maxRequests: int("maxRequests").default(100).notNull(),
  
  /** Time window in seconds */
  windowSeconds: int("windowSeconds").default(60).notNull(),
  
  /** Whether this config is enabled */
  isEnabled: mysqlEnum("isEnabled", ["true", "false"]).default("true").notNull(),
  
  /** Block duration in seconds when limit exceeded */
  blockDurationSeconds: int("blockDurationSeconds").default(60),
  
  /** Custom error message */
  errorMessage: varchar("errorMessage", { length: 500 }),
  
  /** Priority (lower = higher priority, for pattern matching) */
  priority: int("priority").default(100),
  
  /** Description of this rule */
  description: text("description"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RateLimitConfig = typeof rateLimitConfig.$inferSelect;
export type InsertRateLimitConfig = typeof rateLimitConfig.$inferInsert;


// ============================================
// RATE LIMIT USAGE - Track rate limit hits and blocks
// ============================================
export const rateLimitUsage = mysqlTable("rate_limit_usage", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Timestamp of the event */
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  /** Endpoint that was accessed */
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  
  /** IP address (anonymized) */
  ipAddress: varchar("ipAddress", { length: 45 }),
  
  /** Whether request was blocked */
  wasBlocked: mysqlEnum("wasBlocked", ["true", "false"]).default("false").notNull(),
  
  /** Current request count in window */
  requestCount: int("requestCount").default(1),
  
  /** Rate limit config ID that was applied */
  configId: int("configId"),
  
  /** Date key for aggregation (YYYY-MM-DD) */
  dateKey: varchar("dateKey", { length: 10 }),
  
  /** Hour of day (0-23) */
  hourOfDay: int("hourOfDay"),
});

export type RateLimitUsage = typeof rateLimitUsage.$inferSelect;
export type InsertRateLimitUsage = typeof rateLimitUsage.$inferInsert;


// ============================================
// QUERY METRICS - Track database query performance
// ============================================
export const queryMetrics = mysqlTable("query_metrics", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Timestamp of the query */
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  /** Query type (SELECT, INSERT, UPDATE, DELETE) */
  queryType: varchar("queryType", { length: 20 }).notNull(),
  
  /** Table name being queried */
  tableName: varchar("tableName", { length: 100 }),
  
  /** Query execution time in milliseconds */
  executionTime: int("executionTime").notNull(),
  
  /** Number of rows affected/returned */
  rowCount: int("rowCount"),
  
  /** Whether query was successful */
  isSuccess: mysqlEnum("isSuccess", ["true", "false"]).default("true").notNull(),
  
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  
  /** Query hash for grouping similar queries */
  queryHash: varchar("queryHash", { length: 64 }),
  
  /** Caller endpoint (which API triggered this query) */
  callerEndpoint: varchar("callerEndpoint", { length: 255 }),
  
  /** Date key for aggregation (YYYY-MM-DD) */
  dateKey: varchar("dateKey", { length: 10 }),
});

export type QueryMetric = typeof queryMetrics.$inferSelect;
export type InsertQueryMetric = typeof queryMetrics.$inferInsert;


// ============================================
// QUERY DAILY STATS - Aggregated daily query statistics
// ============================================
export const queryDailyStats = mysqlTable("query_daily_stats", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Date (YYYY-MM-DD) */
  dateKey: varchar("dateKey", { length: 10 }).notNull(),
  
  /** Query type */
  queryType: varchar("queryType", { length: 20 }).notNull(),
  
  /** Table name */
  tableName: varchar("tableName", { length: 100 }),
  
  /** Total number of queries */
  totalQueries: int("totalQueries").default(0),
  
  /** Number of successful queries */
  successfulQueries: int("successfulQueries").default(0),
  
  /** Number of failed queries */
  failedQueries: int("failedQueries").default(0),
  
  /** Average execution time in ms */
  avgExecutionTime: int("avgExecutionTime").default(0),
  
  /** Min execution time in ms */
  minExecutionTime: int("minExecutionTime").default(0),
  
  /** Max execution time in ms */
  maxExecutionTime: int("maxExecutionTime").default(0),
  
  /** P50 execution time in ms */
  p50ExecutionTime: int("p50ExecutionTime").default(0),
  
  /** P95 execution time in ms */
  p95ExecutionTime: int("p95ExecutionTime").default(0),
  
  /** P99 execution time in ms */
  p99ExecutionTime: int("p99ExecutionTime").default(0),
  
  /** Total rows affected/returned */
  totalRows: bigint("totalRows", { mode: "number" }).default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QueryDailyStat = typeof queryDailyStats.$inferSelect;
export type InsertQueryDailyStat = typeof queryDailyStats.$inferInsert;


// ============================================
// PERFORMANCE ALERTS - Real-time alert configuration and history
// ============================================
export const performanceAlerts = mysqlTable("performance_alerts", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Alert name */
  name: varchar("name", { length: 255 }).notNull(),
  
  /** Alert type: endpoint_p95, query_slow, rate_limit, error_rate */
  alertType: varchar("alertType", { length: 50 }).notNull(),
  
  /** Target (endpoint pattern, table name, or * for all) */
  target: varchar("target", { length: 255 }).default("*"),
  
  /** Metric to monitor: p95, p99, avg, error_rate, execution_time */
  metric: varchar("metric", { length: 50 }).notNull(),
  
  /** Threshold value (ms for time, percentage for rates) */
  threshold: int("threshold").notNull(),
  
  /** Comparison operator: gt, gte, lt, lte, eq */
  operator: varchar("operator", { length: 10 }).default("gt"),
  
  /** Evaluation window in minutes */
  evaluationWindow: int("evaluationWindow").default(5),
  
  /** Cooldown period in minutes (prevent alert spam) */
  cooldownMinutes: int("cooldownMinutes").default(15),
  
  /** Whether alert is enabled */
  isEnabled: mysqlEnum("isEnabled", ["true", "false"]).default("true").notNull(),
  
  /** Notification channels: email, slack, telegram, webhook */
  notificationChannels: varchar("notificationChannels", { length: 255 }).default("email"),
  
  /** Severity: info, warning, critical */
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("warning").notNull(),
  
  /** Last triggered timestamp */
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  
  /** Trigger count */
  triggerCount: int("triggerCount").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceAlert = typeof performanceAlerts.$inferSelect;
export type InsertPerformanceAlert = typeof performanceAlerts.$inferInsert;


// ============================================
// ALERT HISTORY - Log of triggered alerts
// ============================================
export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Reference to performance_alerts */
  alertId: int("alertId").notNull(),
  
  /** Timestamp when alert was triggered */
  triggeredAt: timestamp("triggeredAt").defaultNow().notNull(),
  
  /** Current value that triggered the alert */
  currentValue: int("currentValue").notNull(),
  
  /** Threshold value */
  thresholdValue: int("thresholdValue").notNull(),
  
  /** Target that triggered (specific endpoint or table) */
  triggeredTarget: varchar("triggeredTarget", { length: 255 }),
  
  /** Alert status: triggered, acknowledged, resolved */
  status: mysqlEnum("status", ["triggered", "acknowledged", "resolved"]).default("triggered").notNull(),
  
  /** Acknowledged by user ID */
  acknowledgedBy: int("acknowledgedBy"),
  
  /** Acknowledged timestamp */
  acknowledgedAt: timestamp("acknowledgedAt"),
  
  /** Resolution notes */
  resolutionNotes: text("resolutionNotes"),
  
  /** Resolved timestamp */
  resolvedAt: timestamp("resolvedAt"),
  
  /** Notification sent status */
  notificationSent: mysqlEnum("notificationSent", ["true", "false"]).default("false").notNull(),
});

export type AlertHistoryItem = typeof alertHistory.$inferSelect;
export type InsertAlertHistoryItem = typeof alertHistory.$inferInsert;


// ============================================
// PASSWORD RESET TOKENS
// ============================================
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  
  /** User ID */
  userId: int("userId").notNull(),
  
  /** Reset token (hashed) */
  token: varchar("token", { length: 255 }).notNull().unique(),
  
  /** Expiration timestamp */
  expiresAt: timestamp("expiresAt").notNull(),
  
  /** Whether token has been used */
  isUsed: mysqlEnum("isUsed", ["true", "false"]).default("false").notNull(),
  
  /** IP address of requester */
  ipAddress: varchar("ipAddress", { length: 45 }),
  
  /** User agent of requester */
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ============================================
// TWO-FACTOR AUTHENTICATION SETTINGS
// ============================================
export const user2FASettings = mysqlTable("user_2fa_settings", {
  id: int("id").autoincrement().primaryKey(),
  
  /** User ID */
  userId: int("userId").notNull().unique(),
  
  /** Whether 2FA is enabled */
  isEnabled: mysqlEnum("isEnabled", ["true", "false"]).default("false").notNull(),
  
  /** TOTP secret (encrypted) */
  totpSecret: varchar("totpSecret", { length: 255 }),
  
  /** Backup codes (JSON array, hashed) */
  backupCodes: text("backupCodes"),
  
  /** Number of backup codes used */
  backupCodesUsed: int("backupCodesUsed").default(0),
  
  /** Last verified timestamp */
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  
  /** Failed attempts count (for rate limiting) */
  failedAttempts: int("failedAttempts").default(0),
  
  /** Lockout until timestamp */
  lockedUntil: timestamp("lockedUntil"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User2FASetting = typeof user2FASettings.$inferSelect;
export type InsertUser2FASetting = typeof user2FASettings.$inferInsert;

// ============================================
// USER SESSIONS
// ============================================
export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  
  /** User ID */
  userId: int("userId").notNull(),
  
  /** Session token (hashed) */
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  
  /** Device type: desktop, mobile, tablet */
  deviceType: varchar("deviceType", { length: 50 }),
  
  /** Device name/model */
  deviceName: varchar("deviceName", { length: 255 }),
  
  /** Browser name */
  browser: varchar("browser", { length: 100 }),
  
  /** Operating system */
  os: varchar("os", { length: 100 }),
  
  /** IP address */
  ipAddress: varchar("ipAddress", { length: 45 }),
  
  /** Location (city, country) */
  location: varchar("location", { length: 255 }),
  
  /** User agent string */
  userAgent: text("userAgent"),
  
  /** Whether this is the current session */
  isCurrent: mysqlEnum("isCurrent", ["true", "false"]).default("false").notNull(),
  
  /** Last activity timestamp */
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  
  /** Expiration timestamp */
  expiresAt: timestamp("expiresAt").notNull(),
  
  /** Whether session is revoked */
  isRevoked: mysqlEnum("isRevoked", ["true", "false"]).default("false").notNull(),
  
  /** Revoked at timestamp */
  revokedAt: timestamp("revokedAt"),
  
  /** Revoke reason */
  revokeReason: varchar("revokeReason", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;


// =====================================================
// User Access History - Lịch sử truy cập và thay đổi
// =====================================================
export const userAccessHistory = mysqlTable("user_access_history", {
  id: int("id").primaryKey().autoincrement(),
  
  /** User ID */
  userId: int("userId").notNull(),
  
  /** Action type: login, logout, password_change, 2fa_enable, 2fa_disable, profile_update, etc. */
  actionType: varchar("actionType", { length: 100 }).notNull(),
  
  /** Action description */
  description: text("description"),
  
  /** IP address */
  ipAddress: varchar("ipAddress", { length: 45 }),
  
  /** User agent */
  userAgent: text("userAgent"),
  
  /** Device info */
  deviceInfo: varchar("deviceInfo", { length: 255 }),
  
  /** Browser */
  browser: varchar("browser", { length: 100 }),
  
  /** Operating system */
  os: varchar("os", { length: 100 }),
  
  /** Location (city, country) */
  location: varchar("location", { length: 255 }),
  
  /** Additional metadata (JSON) */
  metadata: text("metadata"),
  
  /** Status: success, failed, blocked */
  status: mysqlEnum("status", ["success", "failed", "blocked"]).default("success").notNull(),
  
  /** Risk level: low, medium, high */
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("low").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserAccessHistory = typeof userAccessHistory.$inferSelect;
export type InsertUserAccessHistory = typeof userAccessHistory.$inferInsert;

// =====================================================
// Known Devices - Thiết bị đã biết của user
// =====================================================
export const knownDevices = mysqlTable("known_devices", {
  id: int("id").primaryKey().autoincrement(),
  
  /** User ID */
  userId: int("userId").notNull(),
  
  /** Device fingerprint (hash of device info) */
  deviceFingerprint: varchar("deviceFingerprint", { length: 64 }).notNull(),
  
  /** Device name */
  deviceName: varchar("deviceName", { length: 255 }),
  
  /** Device type: desktop, mobile, tablet */
  deviceType: varchar("deviceType", { length: 50 }),
  
  /** Browser */
  browser: varchar("browser", { length: 100 }),
  
  /** Operating system */
  os: varchar("os", { length: 100 }),
  
  /** Last IP address */
  lastIpAddress: varchar("lastIpAddress", { length: 45 }),
  
  /** Last location */
  lastLocation: varchar("lastLocation", { length: 255 }),
  
  /** Whether device is trusted */
  isTrusted: mysqlEnum("isTrusted", ["true", "false"]).default("false").notNull(),
  
  /** First seen */
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
  
  /** Last seen */
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnownDevice = typeof knownDevices.$inferSelect;
export type InsertKnownDevice = typeof knownDevices.$inferInsert;

// =====================================================
// Security Settings - Cài đặt bảo mật
// =====================================================
export const securitySettings = mysqlTable("security_settings", {
  id: int("id").primaryKey().autoincrement(),
  
  /** Setting key */
  key: varchar("key", { length: 100 }).notNull().unique(),
  
  /** Setting value */
  value: text("value").notNull(),
  
  /** Setting description */
  description: text("description"),
  
  /** Setting type: boolean, string, number, json */
  type: varchar("type", { length: 50 }).default("string").notNull(),
  
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SecuritySetting = typeof securitySettings.$inferSelect;
export type InsertSecuritySetting = typeof securitySettings.$inferInsert;

// =====================================================
// User Security Preferences - Cài đặt bảo mật của user
// =====================================================
export const userSecurityPreferences = mysqlTable("user_security_preferences", {
  id: int("id").primaryKey().autoincrement(),
  
  /** User ID */
  userId: int("userId").notNull().unique(),
  
  /** Notify on new login */
  notifyOnNewLogin: mysqlEnum("notifyOnNewLogin", ["true", "false"]).default("true").notNull(),
  
  /** Notify on password change */
  notifyOnPasswordChange: mysqlEnum("notifyOnPasswordChange", ["true", "false"]).default("true").notNull(),
  
  /** Notify on 2FA change */
  notifyOn2FAChange: mysqlEnum("notifyOn2FAChange", ["true", "false"]).default("true").notNull(),
  
  /** Require 2FA for sensitive actions */
  require2FAForSensitiveActions: mysqlEnum("require2FAForSensitiveActions", ["true", "false"]).default("false").notNull(),
  
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSecurityPreference = typeof userSecurityPreferences.$inferSelect;
export type InsertUserSecurityPreference = typeof userSecurityPreferences.$inferInsert;
