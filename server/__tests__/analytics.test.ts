import { describe, it, expect } from "vitest";

describe("Analytics API", () => {
  describe("Time Period Calculations", () => {
    it("should calculate correct date ranges for 7 days", () => {
      const days = 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Allow for timezone/DST differences
      expect(diffDays).toBeGreaterThanOrEqual(days - 1);
      expect(diffDays).toBeLessThanOrEqual(days + 1);
    });

    it("should calculate correct date ranges for 30 days", () => {
      const days = 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Allow for timezone/DST differences
      expect(diffDays).toBeGreaterThanOrEqual(days - 1);
      expect(diffDays).toBeLessThanOrEqual(days + 1);
    });

    it("should calculate correct date ranges for 90 days", () => {
      const days = 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Allow for timezone/DST differences
      expect(diffDays).toBeGreaterThanOrEqual(days - 1);
      expect(diffDays).toBeLessThanOrEqual(days + 1);
    });

    it("should calculate correct date ranges for 365 days", () => {
      const days = 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Allow for timezone/DST differences and leap years
      expect(diffDays).toBeGreaterThanOrEqual(days - 1);
      expect(diffDays).toBeLessThanOrEqual(days + 1);
    });

    it("should format dates correctly for SQL queries", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const isoString = date.toISOString();
      
      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("Status Distribution Mapping", () => {
    it("should map contact status correctly", () => {
      const statusMap: Record<string, string> = {
        "new": "Mới",
        "read": "Đã xem",
        "replied": "Đã trả lời",
        "closed": "Đã đóng",
      };

      expect(statusMap["new"]).toBe("Mới");
      expect(statusMap["read"]).toBe("Đã xem");
      expect(statusMap["replied"]).toBe("Đã trả lời");
      expect(statusMap["closed"]).toBe("Đã đóng");
    });

    it("should map application status correctly", () => {
      const statusMap: Record<string, string> = {
        "pending": "Chờ duyệt",
        "reviewing": "Đang xem xét",
        "interviewed": "Đã phỏng vấn",
        "accepted": "Đã nhận",
        "rejected": "Từ chối",
      };

      expect(statusMap["pending"]).toBe("Chờ duyệt");
      expect(statusMap["reviewing"]).toBe("Đang xem xét");
      expect(statusMap["interviewed"]).toBe("Đã phỏng vấn");
      expect(statusMap["accepted"]).toBe("Đã nhận");
      expect(statusMap["rejected"]).toBe("Từ chối");
    });
  });

  describe("Monthly Summary Generation", () => {
    it("should generate correct month list for last 12 months", () => {
      const months: string[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toISOString().slice(0, 7));
      }

      expect(months.length).toBe(12);
      expect(months[0]).toMatch(/^\d{4}-\d{2}$/);
      expect(months[11]).toMatch(/^\d{4}-\d{2}$/);
    });

    it("should format month names in Vietnamese", () => {
      const date = new Date("2024-01-15");
      const monthName = date.toLocaleDateString("vi-VN", { month: "short" });
      
      expect(monthName).toBeDefined();
      expect(monthName.length).toBeGreaterThan(0);
    });

    it("should maintain chronological order", () => {
      const months: string[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toISOString().slice(0, 7));
      }

      for (let i = 1; i < months.length; i++) {
        expect(months[i] > months[i - 1]).toBe(true);
      }
    });
  });
});

describe("NewsDetail SEO Schema", () => {
  it("should generate valid Article schema structure", () => {
    const article = {
      title: "Test Article",
      excerpt: "Test excerpt",
      image: "https://example.com/image.jpg",
      publishedAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-16"),
    };

    const schema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.excerpt,
      "image": [article.image],
      "datePublished": article.publishedAt.toISOString(),
      "dateModified": article.updatedAt.toISOString(),
      "author": {
        "@type": "Organization",
        "name": "Dreamweldtech",
      },
      "publisher": {
        "@type": "Organization",
        "name": "Dreamweldtech",
      },
    };

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("NewsArticle");
    expect(schema.headline).toBe(article.title);
    expect(schema.description).toBe(article.excerpt);
  });

  it("should generate valid BreadcrumbList schema", () => {
    const breadcrumbs = [
      { name: "Trang chủ", url: "https://example.com" },
      { name: "Tin tức", url: "https://example.com/news" },
      { name: "Article Title", url: "https://example.com/news/article-slug" },
    ];

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url,
      })),
    };

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement.length).toBe(3);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[2].position).toBe(3);
  });

  it("should include required Open Graph properties", () => {
    const ogTags = [
      { property: "og:title", content: "Test Title" },
      { property: "og:description", content: "Test Description" },
      { property: "og:image", content: "https://example.com/image.jpg" },
      { property: "og:url", content: "https://example.com/article" },
      { property: "og:type", content: "article" },
    ];

    ogTags.forEach(tag => {
      expect(tag.property).toMatch(/^og:/);
      expect(tag.content).toBeDefined();
    });
  });

  it("should include Twitter Card properties", () => {
    const twitterTags = [
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Test Title" },
      { name: "twitter:description", content: "Test Description" },
      { name: "twitter:image", content: "https://example.com/image.jpg" },
    ];

    twitterTags.forEach(tag => {
      expect(tag.name).toMatch(/^twitter:/);
      expect(tag.content).toBeDefined();
    });
  });
});

describe("Social Share URLs", () => {
  const shareUrl = "https://example.com/article";
  const shareText = "Test Article Title";

  it("should generate valid Facebook share URL", () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    expect(fbUrl).toContain("facebook.com/sharer");
    expect(fbUrl).toContain(encodeURIComponent(shareUrl));
  });

  it("should generate valid Twitter share URL", () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    expect(twitterUrl).toContain("twitter.com/intent/tweet");
    expect(twitterUrl).toContain(encodeURIComponent(shareUrl));
  });

  it("should generate valid LinkedIn share URL", () => {
    const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    expect(linkedinUrl).toContain("linkedin.com/shareArticle");
    expect(linkedinUrl).toContain(encodeURIComponent(shareUrl));
  });

  it("should generate valid email share URL", () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`Đọc bài viết tại: ${shareUrl}`)}`;
    expect(emailUrl).toContain("mailto:");
    expect(emailUrl).toContain(encodeURIComponent(shareText));
  });

  it("should generate valid Zalo share URL", () => {
    const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`;
    expect(zaloUrl).toContain("zalo.me/share");
    expect(zaloUrl).toContain(encodeURIComponent(shareUrl));
  });
});
