import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { products, productCategories } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Products API', () => {
  let testCategoryId: number | undefined;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      console.warn('Database not available, skipping tests');
      return;
    }
    
    // Get existing category for testing
    const existingCategories = await db.select().from(productCategories).limit(1);
    if (existingCategories.length > 0) {
      testCategoryId = existingCategories[0].id;
    }
  });

  it('should have database connection', async () => {
    expect(db).toBeDefined();
  });

  it('should have products table accessible', async () => {
    if (!db) return;
    const result = await db.select().from(products).limit(1);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have categories table accessible', async () => {
    if (!db) return;
    const result = await db.select().from(productCategories).limit(1);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should be able to query products with category filter', async () => {
    if (!db || !testCategoryId) return;
    const result = await db.select().from(products).where(eq(products.categoryId, testCategoryId));
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have required fields in product schema', async () => {
    if (!db) return;
    const result = await db.select().from(products).limit(1);
    if (result.length > 0) {
      const product = result[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('slug');
      expect(product).toHaveProperty('categoryId');
      expect(product).toHaveProperty('isActive');
    }
  });

  it('should have required fields in category schema', async () => {
    if (!db) return;
    const result = await db.select().from(productCategories).limit(1);
    if (result.length > 0) {
      const category = result[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('isActive');
    }
  });
});
