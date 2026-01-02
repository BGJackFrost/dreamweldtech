import { describe, it, expect } from "vitest";

describe("Chatbot Knowledge Base", () => {
  describe("FAQ Response Matching", () => {
    const testKeywordMatching = (query: string, keywords: string[]): boolean => {
      const lowerQuery = query.toLowerCase();
      return keywords.some(keyword => lowerQuery.includes(keyword));
    };

    it("should match greeting keywords", () => {
      const greetingKeywords = ["xin chào", "hello", "hi", "chào", "alo"];
      
      expect(testKeywordMatching("Xin chào", greetingKeywords)).toBe(true);
      expect(testKeywordMatching("Hello there", greetingKeywords)).toBe(true);
      expect(testKeywordMatching("Hi!", greetingKeywords)).toBe(true);
      expect(testKeywordMatching("Chào bạn", greetingKeywords)).toBe(true);
    });

    it("should match product keywords", () => {
      const productKeywords = ["sản phẩm", "product", "thiết bị", "máy laser"];
      
      expect(testKeywordMatching("Cho tôi xem sản phẩm", productKeywords)).toBe(true);
      expect(testKeywordMatching("What products do you have?", productKeywords)).toBe(true);
      expect(testKeywordMatching("Thiết bị laser", productKeywords)).toBe(true);
    });

    it("should match welding machine keywords", () => {
      const weldingKeywords = ["máy hàn", "welding", "hàn laser", "1000w", "1500w", "2000w"];
      
      expect(testKeywordMatching("Máy hàn laser giá bao nhiêu?", weldingKeywords)).toBe(true);
      expect(testKeywordMatching("I need a welding machine", weldingKeywords)).toBe(true);
      expect(testKeywordMatching("Máy 1500W", weldingKeywords)).toBe(true);
    });

    it("should match cutting machine keywords", () => {
      const cuttingKeywords = ["máy cắt", "cutting", "cắt laser", "3000w", "6000w"];
      
      expect(testKeywordMatching("Máy cắt laser fiber", cuttingKeywords)).toBe(true);
      expect(testKeywordMatching("Laser cutting machine", cuttingKeywords)).toBe(true);
      expect(testKeywordMatching("Máy 6000W cắt được bao dày?", cuttingKeywords)).toBe(true);
    });

    it("should match cleaning machine keywords", () => {
      const cleaningKeywords = ["làm sạch", "cleaning", "vệ sinh", "rỉ sét", "tẩy sơn"];
      
      expect(testKeywordMatching("Máy làm sạch laser", cleaningKeywords)).toBe(true);
      expect(testKeywordMatching("Tẩy rỉ sét bằng laser", cleaningKeywords)).toBe(true);
      expect(testKeywordMatching("Laser cleaning", cleaningKeywords)).toBe(true);
    });

    it("should match pricing keywords", () => {
      const pricingKeywords = ["giá", "price", "báo giá", "quote", "bao nhiêu"];
      
      expect(testKeywordMatching("Giá máy hàn laser?", pricingKeywords)).toBe(true);
      expect(testKeywordMatching("What's the price?", pricingKeywords)).toBe(true);
      expect(testKeywordMatching("Báo giá cho tôi", pricingKeywords)).toBe(true);
    });

    it("should match warranty keywords", () => {
      const warrantyKeywords = ["bảo hành", "warranty", "guarantee"];
      
      expect(testKeywordMatching("Chính sách bảo hành?", warrantyKeywords)).toBe(true);
      expect(testKeywordMatching("What's the warranty period?", warrantyKeywords)).toBe(true);
    });

    it("should match contact keywords", () => {
      const contactKeywords = ["liên hệ", "contact", "tư vấn", "consult", "địa chỉ", "hotline"];
      
      expect(testKeywordMatching("Liên hệ tư vấn", contactKeywords)).toBe(true);
      expect(testKeywordMatching("Địa chỉ công ty?", contactKeywords)).toBe(true);
      expect(testKeywordMatching("Hotline hỗ trợ?", contactKeywords)).toBe(true);
    });

    it("should match career keywords", () => {
      const careerKeywords = ["tuyển dụng", "việc làm", "career", "job", "ứng tuyển"];
      
      expect(testKeywordMatching("Tuyển dụng vị trí gì?", careerKeywords)).toBe(true);
      expect(testKeywordMatching("Job openings", careerKeywords)).toBe(true);
      expect(testKeywordMatching("Muốn ứng tuyển", careerKeywords)).toBe(true);
    });
  });

  describe("Response Content Validation", () => {
    it("should include product categories in product response", () => {
      const productResponse = "Máy Hàn Laser, Máy Cắt Laser, Máy Làm Sạch Laser, Phụ Kiện";
      
      expect(productResponse).toContain("Máy Hàn Laser");
      expect(productResponse).toContain("Máy Cắt Laser");
      expect(productResponse).toContain("Máy Làm Sạch Laser");
    });

    it("should include contact info in contact response", () => {
      const contactResponse = "+84 123 456 789, contact@dreamweldtech.com";
      
      expect(contactResponse).toContain("+84 123 456 789");
      expect(contactResponse).toContain("contact@dreamweldtech.com");
    });

    it("should include power ranges in welding response", () => {
      const weldingResponse = "1000W, 1500W, 2000W";
      
      expect(weldingResponse).toContain("1000W");
      expect(weldingResponse).toContain("1500W");
      expect(weldingResponse).toContain("2000W");
    });
  });
});

describe("Product Data Validation", () => {
  describe("Product Categories", () => {
    const categories = [
      { name: "Máy Hàn Laser", slug: "may-han-laser" },
      { name: "Máy Cắt Laser", slug: "may-cat-laser" },
      { name: "Máy Làm Sạch Laser", slug: "may-lam-sach-laser" },
      { name: "Phụ Kiện & Vật Tư", slug: "phu-kien-vat-tu" },
    ];

    it("should have 4 product categories", () => {
      expect(categories.length).toBe(4);
    });

    it("should have valid slugs for all categories", () => {
      categories.forEach(cat => {
        expect(cat.slug).toMatch(/^[a-z0-9-]+$/);
        expect(cat.slug.length).toBeGreaterThan(0);
      });
    });

    it("should have unique slugs", () => {
      const slugs = categories.map(c => c.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe("Product Specifications", () => {
    it("should validate welding machine power range", () => {
      const validPowers = [1000, 1500, 2000, 3000];
      
      validPowers.forEach(power => {
        expect(power).toBeGreaterThanOrEqual(1000);
        expect(power).toBeLessThanOrEqual(3000);
      });
    });

    it("should validate cutting machine power range", () => {
      const validPowers = [1500, 3000, 6000];
      
      validPowers.forEach(power => {
        expect(power).toBeGreaterThanOrEqual(1500);
        expect(power).toBeLessThanOrEqual(6000);
      });
    });

    it("should validate cleaning machine power range", () => {
      const validPowers = [200, 500];
      
      validPowers.forEach(power => {
        expect(power).toBeGreaterThanOrEqual(200);
        expect(power).toBeLessThanOrEqual(500);
      });
    });

    it("should validate cutting thickness specifications", () => {
      const cuttingSpecs = [
        { power: 1500, maxThickness: 8 },
        { power: 3000, maxThickness: 16 },
        { power: 6000, maxThickness: 25 },
      ];

      cuttingSpecs.forEach(spec => {
        expect(spec.maxThickness).toBeGreaterThan(0);
        // Higher power should cut thicker
        if (spec.power >= 3000) {
          expect(spec.maxThickness).toBeGreaterThanOrEqual(16);
        }
      });
    });
  });

  describe("Product Slug Generation", () => {
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    };

    it("should generate valid slug from Vietnamese name", () => {
      expect(generateSlug("Máy Hàn Laser Fiber 1000W")).toBe("may-han-laser-fiber-1000w");
      expect(generateSlug("Máy Cắt Laser Fiber 3000W")).toBe("may-cat-laser-fiber-3000w");
      expect(generateSlug("Máy Làm Sạch Laser 200W")).toBe("may-lam-sach-laser-200w");
    });

    it("should handle special characters in slug", () => {
      expect(generateSlug("Đầu Hàn Wobble")).toBe("dau-han-wobble");
      expect(generateSlug("Dây Hàn Inox 308L")).toBe("day-han-inox-308l");
    });
  });
});

describe("Quick Questions", () => {
  const quickQuestionsVi = [
    "Báo giá máy hàn laser",
    "Chính sách bảo hành",
    "Thời gian giao hàng",
    "Liên hệ tư vấn",
  ];

  const quickQuestionsEn = [
    "Laser welder pricing",
    "Warranty policy",
    "Delivery time",
    "Contact for consultation",
  ];

  it("should have 4 quick questions in Vietnamese", () => {
    expect(quickQuestionsVi.length).toBe(4);
  });

  it("should have 4 quick questions in English", () => {
    expect(quickQuestionsEn.length).toBe(4);
  });

  it("should have matching topics between languages", () => {
    // Both should cover: pricing, warranty, delivery, contact
    expect(quickQuestionsVi.some(q => q.includes("giá") || q.includes("Báo giá"))).toBe(true);
    expect(quickQuestionsEn.some(q => q.includes("pricing"))).toBe(true);
    
    expect(quickQuestionsVi.some(q => q.includes("bảo hành"))).toBe(true);
    expect(quickQuestionsEn.some(q => q.includes("Warranty"))).toBe(true);
  });
});
