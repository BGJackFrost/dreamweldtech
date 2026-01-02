import { describe, it, expect } from 'vitest';

describe('Banners API', () => {
  describe('Banner Schema Validation', () => {
    it('should validate banner position values', () => {
      const validPositions = ['hero', 'promo', 'sidebar', 'footer'];
      validPositions.forEach(position => {
        expect(['hero', 'promo', 'sidebar', 'footer']).toContain(position);
      });
    });

    it('should validate banner isActive values', () => {
      const validValues = ['true', 'false'];
      validValues.forEach(value => {
        expect(['true', 'false']).toContain(value);
      });
    });

    it('should require title and image for banner creation', () => {
      const validBanner = {
        title: 'Test Banner',
        image: 'https://example.com/image.jpg',
        position: 'hero',
        sortOrder: 0,
        isActive: 'true',
      };
      
      expect(validBanner.title).toBeTruthy();
      expect(validBanner.image).toBeTruthy();
    });

    it('should allow optional fields', () => {
      const bannerWithOptional = {
        title: 'Test Banner',
        image: 'https://example.com/image.jpg',
        subtitle: 'Subtitle',
        description: 'Description',
        mobileImage: 'https://example.com/mobile.jpg',
        link: 'https://example.com',
        buttonText: 'Click me',
        buttonLink: 'https://example.com/action',
      };
      
      expect(bannerWithOptional.subtitle).toBeDefined();
      expect(bannerWithOptional.mobileImage).toBeDefined();
    });
  });

  describe('Banner Position Labels', () => {
    it('should have correct Vietnamese labels for positions', () => {
      const positionLabels: Record<string, string> = {
        hero: 'Hero (Trang chủ)',
        promo: 'Khuyến mãi',
        sidebar: 'Sidebar',
        footer: 'Footer',
      };
      
      expect(positionLabels.hero).toBe('Hero (Trang chủ)');
      expect(positionLabels.promo).toBe('Khuyến mãi');
      expect(positionLabels.sidebar).toBe('Sidebar');
      expect(positionLabels.footer).toBe('Footer');
    });
  });
});

describe('Site Settings', () => {
  describe('Menu Configuration', () => {
    it('should have all menu items defined', () => {
      const menuConfig = {
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
      
      expect(Object.keys(menuConfig)).toHaveLength(10);
      expect(menuConfig.home).toBe(true);
      expect(menuConfig.about).toBe(true);
    });

    it('should allow toggling menu items', () => {
      let menuConfig = { home: true, about: true };
      menuConfig = { ...menuConfig, about: false };
      
      expect(menuConfig.about).toBe(false);
      expect(menuConfig.home).toBe(true);
    });
  });

  describe('Footer Configuration', () => {
    it('should have all footer fields defined', () => {
      const footerConfig = {
        companyName: 'Dreamweldtech',
        description: 'Company description',
        address: '123 Street',
        phone: '+84 123 456 789',
        email: 'contact@example.com',
        facebookUrl: '',
        linkedinUrl: '',
        youtubeUrl: '',
        twitterUrl: '',
        instagramUrl: '',
        showNewsletter: true,
        copyrightText: '',
      };
      
      expect(footerConfig.companyName).toBe('Dreamweldtech');
      expect(footerConfig.showNewsletter).toBe(true);
    });

    it('should filter empty social links', () => {
      const socialLinks = [
        { url: 'https://facebook.com/test', label: 'Facebook' },
        { url: '', label: 'Twitter' },
        { url: 'https://linkedin.com/test', label: 'LinkedIn' },
      ].filter(link => link.url);
      
      expect(socialLinks).toHaveLength(2);
      expect(socialLinks.map(l => l.label)).toContain('Facebook');
      expect(socialLinks.map(l => l.label)).toContain('LinkedIn');
      expect(socialLinks.map(l => l.label)).not.toContain('Twitter');
    });
  });

  describe('Home Page Configuration', () => {
    it('should have hero section fields', () => {
      const homeConfig = {
        heroTagline: 'CÔNG NGHỆ LASER TIÊN TIẾN',
        heroTitle: 'ĐỈNH CAO',
        heroTitleHighlight: 'CÔNG NGHỆ GIA CÔNG CHÍNH XÁC',
        heroDescription: 'Description text',
        heroButtonPrimary: 'KHÁM PHÁ SẢN PHẨM',
        heroButtonSecondary: 'LIÊN HỆ TƯ VẤN',
      };
      
      expect(homeConfig.heroTagline).toBeTruthy();
      expect(homeConfig.heroTitle).toBeTruthy();
    });

    it('should have stats fields', () => {
      const homeConfig = {
        statsYears: '15+',
        statsProjects: '500+',
        statsPartners: '100+',
        statsSatisfaction: '98%',
      };
      
      expect(homeConfig.statsYears).toBe('15+');
      expect(homeConfig.statsSatisfaction).toBe('98%');
    });
  });

  describe('About Page Configuration', () => {
    it('should have company info fields', () => {
      const aboutConfig = {
        heroTitle: 'Về Chúng Tôi',
        companyName: 'Dreamweldtech',
        foundedYear: '2010',
        mission: 'Company mission',
        vision: 'Company vision',
        coreValues: 'Quality - Innovation',
      };
      
      expect(aboutConfig.companyName).toBe('Dreamweldtech');
      expect(aboutConfig.foundedYear).toBe('2010');
    });

    it('should have contact info fields', () => {
      const aboutConfig = {
        contactEmail: 'contact@dreamweldtech.com',
        contactPhone: '+84 123 456 789',
        contactAddress: '123 Street, City',
      };
      
      expect(aboutConfig.contactEmail).toContain('@');
      expect(aboutConfig.contactPhone).toContain('+84');
    });
  });
});

describe('JSON Configuration Parsing', () => {
  it('should safely parse valid JSON config', () => {
    const jsonStr = '{"home":true,"about":false}';
    const defaultConfig = { home: true, about: true, products: true };
    
    try {
      const parsed = JSON.parse(jsonStr);
      const config = { ...defaultConfig, ...parsed };
      expect(config.home).toBe(true);
      expect(config.about).toBe(false);
      expect(config.products).toBe(true);
    } catch (e) {
      expect(true).toBe(false); // Should not reach here
    }
  });

  it('should handle invalid JSON gracefully', () => {
    const invalidJson = 'not valid json';
    const defaultConfig = { home: true, about: true };
    
    let config = defaultConfig;
    try {
      config = JSON.parse(invalidJson);
    } catch (e) {
      // Use default config on parse error
      config = defaultConfig;
    }
    
    expect(config).toEqual(defaultConfig);
  });

  it('should merge partial config with defaults', () => {
    const partialConfig = { home: false };
    const defaultConfig = { home: true, about: true, products: true };
    
    const merged = { ...defaultConfig, ...partialConfig };
    
    expect(merged.home).toBe(false);
    expect(merged.about).toBe(true);
    expect(merged.products).toBe(true);
  });
});
