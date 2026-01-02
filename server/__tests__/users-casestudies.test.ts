import { describe, it, expect } from "vitest";
import { getDb } from "../db";
import { users, caseStudies } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Users API", () => {
  describe("Users Table", () => {
    it("should have users table accessible", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      
      if (db) {
        const result = await db.select().from(users).limit(1);
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it("should have role field with correct enum values", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      
      if (db) {
        const result = await db.select().from(users).limit(1);
        if (result.length > 0) {
          expect(["user", "editor", "admin"]).toContain(result[0].role);
        }
      }
    });
  });
});

describe("Case Studies API", () => {
  describe("Case Studies Table", () => {
    it("should have case_studies table accessible", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      
      if (db) {
        const result = await db.select().from(caseStudies).limit(1);
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it("should be able to query case studies with filters", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      
      if (db) {
        // Query active case studies
        const result = await db.select().from(caseStudies).where(eq(caseStudies.isActive, "true"));
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it("should have required fields in case study records", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      
      if (db) {
        const result = await db.select().from(caseStudies).limit(1);
        if (result.length > 0) {
          const caseStudy = result[0];
          expect(caseStudy).toHaveProperty("id");
          expect(caseStudy).toHaveProperty("title");
          expect(caseStudy).toHaveProperty("slug");
          expect(caseStudy).toHaveProperty("clientName");
          expect(caseStudy).toHaveProperty("isActive");
          expect(caseStudy).toHaveProperty("isFeatured");
        }
      }
    });
  });
});
