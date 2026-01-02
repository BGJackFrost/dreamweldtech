import { getDb } from "./db";
import { products, news, jobs, partners, portfolioItems, caseStudies, faqs } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const BASE_URL = process.env.VITE_APP_URL || "https://dreamweldtech.com";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString().split("T")[0];
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateSitemap(): Promise<string> {
  const urls: SitemapUrl[] = [];
  const db = await getDb();

  // Static pages
  const staticPages = [
    { path: "/", priority: 1.0, changefreq: "daily" as const },
    { path: "/about", priority: 0.8, changefreq: "monthly" as const },
    { path: "/products", priority: 0.9, changefreq: "weekly" as const },
    { path: "/solutions", priority: 0.8, changefreq: "monthly" as const },
    { path: "/portfolio", priority: 0.7, changefreq: "weekly" as const },
    { path: "/partners", priority: 0.7, changefreq: "monthly" as const },
    { path: "/news", priority: 0.8, changefreq: "daily" as const },
    { path: "/careers", priority: 0.8, changefreq: "weekly" as const },
    { path: "/contact", priority: 0.7, changefreq: "monthly" as const },
    { path: "/faq", priority: 0.6, changefreq: "monthly" as const },
    { path: "/compare", priority: 0.6, changefreq: "monthly" as const },
  ];

  for (const page of staticPages) {
    urls.push({
      loc: `${BASE_URL}${page.path}`,
      lastmod: formatDate(new Date()),
      changefreq: page.changefreq,
      priority: page.priority,
    });
  }

  // Dynamic pages from database
  if (db) {
    try {
      // Products
      const productList = await db.select({ slug: products.slug, updatedAt: products.updatedAt })
        .from(products)
        .where(eq(products.isActive, "true"));
      
      for (const product of productList) {
        if (product.slug) {
          urls.push({
            loc: `${BASE_URL}/products/${escapeXml(product.slug)}`,
            lastmod: formatDate(product.updatedAt),
            changefreq: "weekly",
            priority: 0.8,
          });
        }
      }

      // News articles
      const newsList = await db.select({ slug: news.slug, updatedAt: news.updatedAt })
        .from(news)
        .where(eq(news.isPublished, "true"))
        .orderBy(desc(news.publishedAt));
      
      for (const article of newsList) {
        if (article.slug) {
          urls.push({
            loc: `${BASE_URL}/news/${escapeXml(article.slug)}`,
            lastmod: formatDate(article.updatedAt),
            changefreq: "monthly",
            priority: 0.6,
          });
        }
      }

      // Jobs
      const jobList = await db.select({ slug: jobs.slug, createdAt: jobs.createdAt })
        .from(jobs)
        .where(eq(jobs.isActive, "true"));
      
      for (const job of jobList) {
        if (job.slug) {
          urls.push({
            loc: `${BASE_URL}/careers/${escapeXml(job.slug)}`,
            lastmod: formatDate(job.createdAt),
            changefreq: "weekly",
            priority: 0.7,
          });
        }
      }

      // Portfolio items
      const portfolioList = await db.select({ id: portfolioItems.id, title: portfolioItems.title, updatedAt: portfolioItems.updatedAt })
        .from(portfolioItems)
        .where(eq(portfolioItems.isActive, "true"));
      
      for (const item of portfolioList) {
        // Use ID-based URL since portfolio doesn't have slug
        urls.push({
          loc: `${BASE_URL}/portfolio/${item.id}`,
          lastmod: formatDate(item.updatedAt),
          changefreq: "monthly",
          priority: 0.6,
        });
      }

      // Case studies
      const caseStudyList = await db.select({ slug: caseStudies.slug, updatedAt: caseStudies.updatedAt })
        .from(caseStudies)
        .where(eq(caseStudies.isActive, "true"));
      
      for (const study of caseStudyList) {
        if (study.slug) {
          urls.push({
            loc: `${BASE_URL}/case-studies/${escapeXml(study.slug)}`,
            lastmod: formatDate(study.updatedAt),
            changefreq: "monthly",
            priority: 0.6,
          });
        }
      }
    } catch (error) {
      console.error("Error generating dynamic sitemap URLs:", error);
    }
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ""}
    ${url.priority !== undefined ? `<priority>${url.priority.toFixed(1)}</priority>` : ""}
  </url>`).join("\n")}
</urlset>`;

  return xml;
}

export async function generateRobotsTxt(): Promise<string> {
  return `# Robots.txt for Dreamweldtech
User-agent: *
Allow: /

# Disallow admin pages
Disallow: /admin/
Disallow: /api/

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1
`;
}
