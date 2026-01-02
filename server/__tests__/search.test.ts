import { describe, it, expect } from "vitest";
import { getDb } from "../db";
import { products, news } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Search API", () => {
  describe("Products Search", () => {
    it("should return products matching search query", async () => {
      const db = await getDb();
      if (!db) {
        console.log("Database not available, skipping test");
        return;
      }

      // Get all active products
      const allProducts = await db
        .select()
        .from(products)
        .where(eq(products.isActive, "true"));

      expect(allProducts).toBeDefined();
      expect(Array.isArray(allProducts)).toBe(true);

      // Test search filtering logic
      const searchTerm = "laser";
      const searchLower = searchTerm.toLowerCase();
      const filteredProducts = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.shortDescription &&
            p.shortDescription.toLowerCase().includes(searchLower)) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
      );

      // Should find products with "laser" in name or description
      expect(filteredProducts.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-matching search", async () => {
      const db = await getDb();
      if (!db) {
        console.log("Database not available, skipping test");
        return;
      }

      const allProducts = await db
        .select()
        .from(products)
        .where(eq(products.isActive, "true"));

      const searchTerm = "xyznonexistent123";
      const searchLower = searchTerm.toLowerCase();
      const filteredProducts = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.shortDescription &&
            p.shortDescription.toLowerCase().includes(searchLower)) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
      );

      expect(filteredProducts.length).toBe(0);
    });
  });

  describe("News Search", () => {
    it("should return news matching search query", async () => {
      const db = await getDb();
      if (!db) {
        console.log("Database not available, skipping test");
        return;
      }

      // Get all published news
      const allNews = await db
        .select()
        .from(news)
        .where(eq(news.isPublished, "true"));

      expect(allNews).toBeDefined();
      expect(Array.isArray(allNews)).toBe(true);

      // Test search filtering logic
      const searchTerm = "laser";
      const searchLower = searchTerm.toLowerCase();
      const filteredNews = allNews.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          (n.excerpt && n.excerpt.toLowerCase().includes(searchLower)) ||
          (n.content && n.content.toLowerCase().includes(searchLower))
      );

      // Should find news with "laser" in title, excerpt or content
      expect(filteredNews.length).toBeGreaterThan(0);
    });
  });
});
