import { describe, it, expect } from "vitest";
import { getDb } from "../db";
import { jobs, jobApplications } from "../../drizzle/schema";

describe("Jobs API", () => {
  describe("Jobs Table", () => {
    it("should have jobs table accessible", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      
      const result = await db!.select().from(jobs).limit(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should be able to insert a new job", async () => {
      const db = await getDb();
      expect(db).toBeDefined();

      const testJob = {
        title: "Test Engineer",
        slug: "test-engineer-" + Date.now(),
        department: "Engineering",
        location: "Ho Chi Minh City",
        type: "full-time" as const,
        experience: "2-3 years",
        salary: "15-25 million VND",
        description: "Test job description",
        requirements: "Test requirements",
        benefits: "Test benefits",
      };

      await db!.insert(jobs).values(testJob);
      
      const inserted = await db!.select().from(jobs).where(
        require("drizzle-orm").eq(jobs.slug, testJob.slug)
      ).limit(1);
      
      expect(inserted.length).toBe(1);
      expect(inserted[0].title).toBe(testJob.title);
      expect(inserted[0].department).toBe(testJob.department);
      
      // Cleanup
      await db!.delete(jobs).where(require("drizzle-orm").eq(jobs.id, inserted[0].id));
    });
  });

  describe("Job Applications Table", () => {
    it("should have job_applications table accessible", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      
      const result = await db!.select().from(jobApplications).limit(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should be able to insert a job application", async () => {
      const db = await getDb();
      expect(db).toBeDefined();

      // First create a test job
      const testJob = {
        title: "Test Position",
        slug: "test-position-" + Date.now(),
      };
      await db!.insert(jobs).values(testJob);
      
      const insertedJob = await db!.select().from(jobs).where(
        require("drizzle-orm").eq(jobs.slug, testJob.slug)
      ).limit(1);

      // Create application for the job
      const testApplication = {
        jobId: insertedJob[0].id,
        name: "Test Applicant",
        email: "test@example.com",
        phone: "0123456789",
        coverLetter: "Test cover letter",
      };

      await db!.insert(jobApplications).values(testApplication);
      
      const insertedApp = await db!.select().from(jobApplications).where(
        require("drizzle-orm").eq(jobApplications.email, testApplication.email)
      ).limit(1);
      
      expect(insertedApp.length).toBe(1);
      expect(insertedApp[0].name).toBe(testApplication.name);
      expect(insertedApp[0].status).toBe("pending");
      
      // Cleanup
      await db!.delete(jobApplications).where(require("drizzle-orm").eq(jobApplications.id, insertedApp[0].id));
      await db!.delete(jobs).where(require("drizzle-orm").eq(jobs.id, insertedJob[0].id));
    });
  });
});
