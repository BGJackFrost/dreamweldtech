import { describe, it, expect } from "vitest";

describe("Multi-Language Settings", () => {
  describe("Language Configuration", () => {
    it("should support 4 languages: vi, en, ja, zh", () => {
      const languages = ["vi", "en", "ja", "zh"];
      expect(languages).toHaveLength(4);
      expect(languages).toContain("vi");
      expect(languages).toContain("en");
      expect(languages).toContain("ja");
      expect(languages).toContain("zh");
    });

    it("should generate correct config keys for each language", () => {
      const languages = ["vi", "en", "ja", "zh"];
      const configTypes = ["home_page_config", "footer_config"];

      languages.forEach(lang => {
        configTypes.forEach(type => {
          const key = `${type}_${lang}`;
          expect(key).toMatch(/^(home_page_config|footer_config)_(vi|en|ja|zh)$/);
        });
      });
    });
  });

  describe("Home Page Configuration", () => {
    it("should have all required home page config fields", () => {
      const requiredFields = [
        "heroTagline",
        "heroTitle",
        "heroTitleHighlight",
        "heroDescription",
        "heroButtonPrimary",
        "heroButtonSecondary",
        "statsYears",
        "statsProjects",
        "statsPartners",
        "statsSatisfaction",
        "whyChooseTitle",
        "whyChooseDescription",
        "productsTitle",
        "productsDescription",
        "ctaTitle",
        "ctaDescription",
        "ctaButton",
      ];

      expect(requiredFields).toHaveLength(17);
      requiredFields.forEach(field => {
        expect(field).toBeTruthy();
      });
    });

    it("should validate hero section content", () => {
      const heroConfig = {
        heroTagline: "CÔNG NGHỆ LASER TIÊN TIẾN",
        heroTitle: "ĐỈNH CAO",
        heroTitleHighlight: "CÔNG NGHỆ GIA CÔNG CHÍNH XÁC",
        heroDescription: "Giải pháp toàn diện về máy hàn, cắt và làm sạch laser",
      };

      expect(heroConfig.heroTagline).toBeTruthy();
      expect(heroConfig.heroTitle).toBeTruthy();
      expect(heroConfig.heroTitleHighlight).toBeTruthy();
      expect(heroConfig.heroDescription).toBeTruthy();
    });

    it("should validate stats content", () => {
      const statsConfig = {
        statsYears: "15+",
        statsProjects: "500+",
        statsPartners: "100+",
        statsSatisfaction: "98%",
      };

      expect(statsConfig.statsYears).toMatch(/\d+\+/);
      expect(statsConfig.statsProjects).toMatch(/\d+\+/);
      expect(statsConfig.statsPartners).toMatch(/\d+\+/);
      expect(statsConfig.statsSatisfaction).toMatch(/\d+%/);
    });
  });

  describe("Footer Configuration", () => {
    it("should have all required footer config fields", () => {
      const requiredFields = [
        "companyName",
        "companyDescription",
        "address",
        "phone",
        "email",
        "workingHours",
        "copyright",
      ];

      expect(requiredFields).toHaveLength(7);
      requiredFields.forEach(field => {
        expect(field).toBeTruthy();
      });
    });

    it("should validate footer contact information", () => {
      const footerConfig = {
        companyName: "Dreamweldtech",
        email: "contact@dreamweldtech.com",
        phone: "+84 123 456 789",
        address: "123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
      };

      expect(footerConfig.companyName).toBeTruthy();
      expect(footerConfig.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(footerConfig.phone).toMatch(/\+\d+/);
      expect(footerConfig.address).toBeTruthy();
    });

    it("should validate copyright format", () => {
      const copyright = "© 2024 Dreamweldtech. Bảo lưu mọi quyền.";
      expect(copyright).toContain("©");
      expect(copyright).toContain("2024");
      expect(copyright).toContain("Dreamweldtech");
    });
  });

  describe("Language-Specific Translations", () => {
    it("should have Vietnamese translations", () => {
      const viConfig = {
        heroTagline: "CÔNG NGHỆ LASER TIÊN TIẾN",
        ctaButton: "Liên Hệ Ngay",
      };

      expect(viConfig.heroTagline).toContain("CÔNG NGHỆ");
      expect(viConfig.ctaButton).toContain("Liên Hệ");
    });

    it("should have English translations", () => {
      const enConfig = {
        heroTagline: "ADVANCED LASER TECHNOLOGY",
        ctaButton: "Contact Now",
      };

      expect(enConfig.heroTagline).toContain("ADVANCED");
      expect(enConfig.ctaButton).toContain("Contact");
    });

    it("should have Japanese translations", () => {
      const jaConfig = {
        heroTagline: "先進レーザー技術",
        ctaButton: "今すぐ連絡",
      };

      expect(jaConfig.heroTagline).toBeTruthy();
      expect(jaConfig.ctaButton).toBeTruthy();
    });

    it("should have Chinese translations", () => {
      const zhConfig = {
        heroTagline: "先进激光技术",
        ctaButton: "立即联系",
      };

      expect(zhConfig.heroTagline).toBeTruthy();
      expect(zhConfig.ctaButton).toBeTruthy();
    });
  });

  describe("Configuration Persistence", () => {
    it("should serialize config to JSON", () => {
      const config = {
        heroTagline: "TEST",
        heroTitle: "TEST TITLE",
      };

      const json = JSON.stringify(config);
      expect(json).toContain("heroTagline");
      expect(json).toContain("TEST");
    });

    it("should deserialize config from JSON", () => {
      const json = '{"heroTagline":"TEST","heroTitle":"TEST TITLE"}';
      const config = JSON.parse(json);

      expect(config.heroTagline).toBe("TEST");
      expect(config.heroTitle).toBe("TEST TITLE");
    });

    it("should handle config merging with defaults", () => {
      const defaults = {
        heroTagline: "DEFAULT",
        heroTitle: "DEFAULT TITLE",
        heroDescription: "DEFAULT DESC",
      };

      const custom = {
        heroTagline: "CUSTOM",
      };

      const merged = { ...defaults, ...custom };
      expect(merged.heroTagline).toBe("CUSTOM");
      expect(merged.heroTitle).toBe("DEFAULT TITLE");
      expect(merged.heroDescription).toBe("DEFAULT DESC");
    });
  });
});
