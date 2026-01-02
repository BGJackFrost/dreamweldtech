import { getDb } from "./db";
import { 
  products, productCategories, news, jobs, faqs, partners, 
  contactRequests, jobApplications, portfolioItems, caseStudies 
} from "../drizzle/schema";

export interface BackupData {
  version: string;
  createdAt: string;
  data: {
    categories: any[];
    products: any[];
    news: any[];
    jobs: any[];
    faqs: any[];
    partners: any[];
    portfolioItems: any[];
    caseStudies: any[];
  };
}

/**
 * Export all data from database to JSON format
 */
export async function exportData(): Promise<BackupData | null> {
  const db = await getDb();
  if (!db) return null;

  const [
    categoriesData,
    productsData,
    newsData,
    jobsData,
    faqsData,
    partnersData,
    portfolioItemsData,
    caseStudiesData,
  ] = await Promise.all([
    db.select().from(productCategories),
    db.select().from(products),
    db.select().from(news),
    db.select().from(jobs),
    db.select().from(faqs),
    db.select().from(partners),
    db.select().from(portfolioItems),
    db.select().from(caseStudies),
  ]);

  return {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    data: {
      categories: categoriesData,
      products: productsData,
      news: newsData,
      jobs: jobsData,
      faqs: faqsData,
      partners: partnersData,
      portfolioItems: portfolioItemsData,
      caseStudies: caseStudiesData,
    },
  };
}

/**
 * Import data from JSON backup
 * @param backupData - The backup data to import
 * @param options - Import options
 */
export async function importData(
  backupData: BackupData,
  options: { 
    overwrite?: boolean; 
    tables?: string[];
  } = {}
): Promise<{ success: boolean; imported: Record<string, number>; errors: string[] }> {
  const db = await getDb();
  if (!db) {
    return { success: false, imported: {}, errors: ["Database not available"] };
  }

  const { overwrite = false, tables } = options;
  const imported: Record<string, number> = {};
  const errors: string[] = [];

  // Validate backup version
  if (!backupData.version || !backupData.data) {
    return { success: false, imported: {}, errors: ["Invalid backup format"] };
  }

  const tableMap: Record<string, { table: any; data: any[] }> = {
    categories: { table: productCategories, data: backupData.data.categories || [] },
    products: { table: products, data: backupData.data.products || [] },
    news: { table: news, data: backupData.data.news || [] },
    jobs: { table: jobs, data: backupData.data.jobs || [] },
    faqs: { table: faqs, data: backupData.data.faqs || [] },
    partners: { table: partners, data: backupData.data.partners || [] },
    portfolioItems: { table: portfolioItems, data: backupData.data.portfolioItems || [] },
    caseStudies: { table: caseStudies, data: backupData.data.caseStudies || [] },
  };

  // Import order matters due to foreign keys
  const importOrder = ["categories", "products", "news", "jobs", "faqs", "partners", "portfolioItems", "caseStudies"];

  for (const tableName of importOrder) {
    // Skip if specific tables requested and this isn't one
    if (tables && tables.length > 0 && !tables.includes(tableName)) {
      continue;
    }

    const { table, data } = tableMap[tableName];
    if (!data || data.length === 0) {
      imported[tableName] = 0;
      continue;
    }

    try {
      if (overwrite) {
        // Delete existing data first (reverse order for foreign keys)
        await db.delete(table);
      }

      // Insert new data
      for (const item of data) {
        // Remove auto-generated fields for insert
        const { id, createdAt, updatedAt, ...insertData } = item;
        try {
          await db.insert(table).values(insertData);
        } catch (insertError: any) {
          // Skip duplicates if not overwriting
          if (!insertError.message?.includes("Duplicate")) {
            errors.push(`${tableName}: ${insertError.message}`);
          }
        }
      }
      imported[tableName] = data.length;
    } catch (error: any) {
      errors.push(`${tableName}: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0,
    imported,
    errors,
  };
}

/**
 * Export contacts and job applications (sensitive data - admin only)
 */
export async function exportSensitiveData(): Promise<{
  contacts: any[];
  jobApplications: any[];
} | null> {
  const db = await getDb();
  if (!db) return null;

  const [contactsData, applicationsData] = await Promise.all([
    db.select().from(contactRequests),
    db.select().from(jobApplications),
  ]);

  return {
    contacts: contactsData,
    jobApplications: applicationsData,
  };
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<Record<string, number> | null> {
  const db = await getDb();
  if (!db) return null;

  const [
    categoriesCount,
    productsCount,
    newsCount,
    jobsCount,
    faqsCount,
    partnersCount,
    contactsCount,
    applicationsCount,
    portfolioCount,
    caseStudiesCount,
  ] = await Promise.all([
    db.select().from(productCategories).then((r: any[]) => r.length),
    db.select().from(products).then((r: any[]) => r.length),
    db.select().from(news).then((r: any[]) => r.length),
    db.select().from(jobs).then((r: any[]) => r.length),
    db.select().from(faqs).then((r: any[]) => r.length),
    db.select().from(partners).then((r: any[]) => r.length),
    db.select().from(contactRequests).then((r: any[]) => r.length),
    db.select().from(jobApplications).then((r: any[]) => r.length),
    db.select().from(portfolioItems).then((r: any[]) => r.length),
    db.select().from(caseStudies).then((r: any[]) => r.length),
  ]);

  return {
    categories: categoriesCount,
    products: productsCount,
    news: newsCount,
    jobs: jobsCount,
    faqs: faqsCount,
    partners: partnersCount,
    contacts: contactsCount,
    jobApplications: applicationsCount,
    portfolioItems: portfolioCount,
    caseStudies: caseStudiesCount,
  };
}
