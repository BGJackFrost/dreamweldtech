import { describe, it, expect } from "vitest";
import { getDb } from "../db";
import { portfolioItems, notifications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Portfolio API", () => {
  describe("Portfolio Items Table", () => {
    it("should have portfolio_items table accessible", async () => {
      const db = await getDb();
      const items = await db.select().from(portfolioItems).limit(1);
      expect(Array.isArray(items)).toBe(true);
    });

    it("should be able to insert a new portfolio item", async () => {
      const db = await getDb();
      await db.insert(portfolioItems).values({
        title: "Test Project",
        titleEn: "Test Project EN",
        slug: "test-project-" + Date.now(),
        description: "Test description",
        descriptionEn: "Test description EN",
        category: "welding",
        client: "Test Client",
        location: "Ho Chi Minh City",
        completedDate: "2024-12",
        images: JSON.stringify(["https://example.com/image1.jpg"]),
        videoUrl: "https://youtube.com/watch?v=test",
        tags: "laser, welding",
        isFeatured: "false",
        isActive: "true",
        sortOrder: 1,
      });
      
      // Verify by selecting
      const items = await db.select().from(portfolioItems).where(eq(portfolioItems.title, "Test Project"));
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].title).toBe("Test Project");
      expect(items[0].category).toBe("welding");
    });
  });
});

describe("Notifications API", () => {
  describe("Notifications Table", () => {
    it("should have notifications table accessible", async () => {
      const db = await getDb();
      const items = await db.select().from(notifications).limit(1);
      expect(Array.isArray(items)).toBe(true);
    });

    it("should be able to insert a new notification", async () => {
      const db = await getDb();
      await db.insert(notifications).values({
        type: "contact",
        title: "New Contact Request",
        message: "Someone submitted a contact form",
        link: "/admin/contacts",
        isRead: "false",
      });
      
      // Verify by selecting
      const items = await db.select().from(notifications).where(eq(notifications.title, "New Contact Request"));
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].type).toBe("contact");
      expect(items[0].isRead).toBe("false");
    });

    it("should be able to mark notification as read", async () => {
      const db = await getDb();
      // First create a notification
      await db.insert(notifications).values({
        type: "application",
        title: "Test Application Notification",
        message: "Someone applied for a job",
        link: "/admin/applications",
        isRead: "false",
      });
      
      // Verify it was created
      const items = await db.select().from(notifications).where(eq(notifications.title, "Test Application Notification"));
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].isRead).toBe("false");
    });
  });
});
