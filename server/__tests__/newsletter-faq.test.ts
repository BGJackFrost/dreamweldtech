import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { newsletterSubscribers, faqs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Newsletter API", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  describe("Newsletter Subscribers", () => {
    it("should have newsletter_subscribers table accessible", async () => {
      const result = await db.select().from(newsletterSubscribers).limit(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should be able to insert a new subscriber", async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      
      // Insert
      await db.insert(newsletterSubscribers).values({
        email: testEmail,
        name: "Test User",
        source: "test",
        isActive: "true",
      });

      // Verify
      const result = await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, testEmail));
      
      expect(result.length).toBe(1);
      expect(result[0].email).toBe(testEmail);
      expect(result[0].name).toBe("Test User");

      // Cleanup
      await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, testEmail));
    });
  });
});

describe("FAQ API", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  describe("FAQ List", () => {
    it("should have faqs table accessible", async () => {
      const result = await db.select().from(faqs).limit(10);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return seeded FAQ data", async () => {
      const result = await db.select().from(faqs).limit(10);
      
      // We seeded 8 FAQs
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("question");
        expect(result[0]).toHaveProperty("answer");
        expect(result[0]).toHaveProperty("category");
      }
    });

    it("should filter FAQs by category", async () => {
      const warrantyFaqs = await db
        .select()
        .from(faqs)
        .where(eq(faqs.category, "warranty"));
      
      expect(Array.isArray(warrantyFaqs)).toBe(true);
      warrantyFaqs.forEach((faq) => {
        expect(faq.category).toBe("warranty");
      });
    });
  });
});
