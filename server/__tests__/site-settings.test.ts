import { describe, it, expect } from 'vitest';

describe('Site Settings', () => {
  describe('Menu Configuration', () => {
    const defaultMenuConfig = {
      home: true,
      about: true,
      products: true,
      solutions: true,
      portfolio: true,
      partners: true,
      news: true,
      careers: true,
      contact: true,
      faq: true,
    };

    it('should have all menu items enabled by default', () => {
      expect(defaultMenuConfig.home).toBe(true);
      expect(defaultMenuConfig.about).toBe(true);
      expect(defaultMenuConfig.products).toBe(true);
      expect(defaultMenuConfig.solutions).toBe(true);
      expect(defaultMenuConfig.portfolio).toBe(true);
      expect(defaultMenuConfig.partners).toBe(true);
      expect(defaultMenuConfig.news).toBe(true);
      expect(defaultMenuConfig.careers).toBe(true);
      expect(defaultMenuConfig.contact).toBe(true);
      expect(defaultMenuConfig.faq).toBe(true);
    });

    it('should be able to toggle menu items', () => {
      const config = { ...defaultMenuConfig };
      config.careers = false;
      config.faq = false;
      
      expect(config.careers).toBe(false);
      expect(config.faq).toBe(false);
      expect(config.home).toBe(true);
    });

    it('should serialize to JSON correctly', () => {
      const config = { ...defaultMenuConfig, careers: false };
      const json = JSON.stringify(config);
      const parsed = JSON.parse(json);
      
      expect(parsed.careers).toBe(false);
      expect(parsed.home).toBe(true);
    });
  });

  describe('About Page Configuration', () => {
    const defaultAboutConfig = {
      heroTitle: "Về Chúng Tôi",
      heroSubtitle: "Đơn vị tiên phong trong lĩnh vực công nghệ laser",
      companyName: "Dreamweldtech",
      foundedYear: "2015",
      mission: "Cung cấp giải pháp công nghệ laser tiên tiến",
      vision: "Trở thành đối tác công nghệ laser hàng đầu",
      coreValues: "Chất lượng - Đổi mới - Tận tâm",
      teamDescription: "Đội ngũ kỹ sư giàu kinh nghiệm",
      historyDescription: "Hơn 10 năm kinh nghiệm",
      contactEmail: "contact@dreamweldtech.com",
      contactPhone: "+84 123 456 789",
      contactAddress: "123 Đường ABC, TP.HCM",
    };

    it('should have all required fields', () => {
      expect(defaultAboutConfig.heroTitle).toBeDefined();
      expect(defaultAboutConfig.heroSubtitle).toBeDefined();
      expect(defaultAboutConfig.companyName).toBeDefined();
      expect(defaultAboutConfig.foundedYear).toBeDefined();
      expect(defaultAboutConfig.mission).toBeDefined();
      expect(defaultAboutConfig.vision).toBeDefined();
      expect(defaultAboutConfig.coreValues).toBeDefined();
      expect(defaultAboutConfig.teamDescription).toBeDefined();
      expect(defaultAboutConfig.historyDescription).toBeDefined();
      expect(defaultAboutConfig.contactEmail).toBeDefined();
      expect(defaultAboutConfig.contactPhone).toBeDefined();
      expect(defaultAboutConfig.contactAddress).toBeDefined();
    });

    it('should calculate years of experience correctly', () => {
      const foundedYear = parseInt(defaultAboutConfig.foundedYear);
      const currentYear = new Date().getFullYear();
      const yearsExperience = currentYear - foundedYear;
      
      expect(yearsExperience).toBeGreaterThan(0);
      expect(yearsExperience).toBeLessThan(100);
    });

    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(defaultAboutConfig.contactEmail)).toBe(true);
    });

    it('should validate phone format', () => {
      const phoneRegex = /^\+?[\d\s-]+$/;
      expect(phoneRegex.test(defaultAboutConfig.contactPhone)).toBe(true);
    });

    it('should serialize to JSON correctly', () => {
      const config = { ...defaultAboutConfig, companyName: "Test Company" };
      const json = JSON.stringify(config);
      const parsed = JSON.parse(json);
      
      expect(parsed.companyName).toBe("Test Company");
      expect(parsed.heroTitle).toBe("Về Chúng Tôi");
    });

    it('should merge with partial config correctly', () => {
      const partialConfig = { companyName: "New Company", foundedYear: "2020" };
      const merged = { ...defaultAboutConfig, ...partialConfig };
      
      expect(merged.companyName).toBe("New Company");
      expect(merged.foundedYear).toBe("2020");
      expect(merged.heroTitle).toBe("Về Chúng Tôi");
    });
  });

  describe('Settings Storage', () => {
    it('should handle empty settings gracefully', () => {
      const emptySettings = null;
      const defaultConfig = { home: true, about: true };
      
      const config = emptySettings ? JSON.parse(emptySettings) : defaultConfig;
      expect(config.home).toBe(true);
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = "not valid json";
      let config = { home: true };
      
      try {
        config = JSON.parse(invalidJson);
      } catch (e) {
        // Keep default config
      }
      
      expect(config.home).toBe(true);
    });

    it('should preserve unknown fields when merging', () => {
      const storedConfig = { home: true, about: false, customField: "value" };
      const defaultConfig = { home: true, about: true, products: true };
      const merged = { ...defaultConfig, ...storedConfig };
      
      expect(merged.home).toBe(true);
      expect(merged.about).toBe(false);
      expect(merged.products).toBe(true);
      expect((merged as any).customField).toBe("value");
    });
  });
});
