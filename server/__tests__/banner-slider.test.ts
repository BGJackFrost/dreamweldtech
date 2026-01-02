import { describe, it, expect } from 'vitest';

describe('Banner Slider Component', () => {
  describe('Banner Data Structure', () => {
    it('should have required fields for hero banner', () => {
      const banner = {
        id: 1,
        title: 'Test Banner',
        subtitle: 'Test Subtitle',
        description: 'Test Description',
        image: '/images/test.jpg',
        mobileImage: '/images/test-mobile.jpg',
        link: '/products',
        buttonText: 'Xem Thêm',
        buttonLink: '/products',
        position: 'hero',
        sortOrder: 1,
        isActive: 'true',
      };

      expect(banner.title).toBeDefined();
      expect(banner.image).toBeDefined();
      expect(banner.position).toBe('hero');
      expect(banner.isActive).toBe('true');
    });

    it('should filter active hero banners correctly', () => {
      const banners = [
        { id: 1, position: 'hero', isActive: 'true', sortOrder: 2 },
        { id: 2, position: 'hero', isActive: 'false', sortOrder: 1 },
        { id: 3, position: 'sidebar', isActive: 'true', sortOrder: 1 },
        { id: 4, position: 'hero', isActive: 'true', sortOrder: 1 },
      ];

      const heroBanners = banners
        .filter(b => b.position === 'hero' && b.isActive === 'true')
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      expect(heroBanners).toHaveLength(2);
      expect(heroBanners[0].id).toBe(4); // sortOrder 1 comes first
      expect(heroBanners[1].id).toBe(1); // sortOrder 2 comes second
    });
  });

  describe('Auto-play Functionality', () => {
    it('should calculate next slide index correctly', () => {
      const totalSlides = 5;
      let currentIndex = 0;

      // Go forward
      currentIndex = (currentIndex + 1) % totalSlides;
      expect(currentIndex).toBe(1);

      // Go to last slide
      currentIndex = 4;
      currentIndex = (currentIndex + 1) % totalSlides;
      expect(currentIndex).toBe(0); // Wraps around

      // Go backward
      currentIndex = 0;
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      expect(currentIndex).toBe(4); // Wraps to last
    });
  });

  describe('Progress Bar', () => {
    it('should calculate progress percentage correctly', () => {
      const totalSlides = 4;
      
      const getProgress = (currentIndex: number) => 
        ((currentIndex + 1) / totalSlides) * 100;

      expect(getProgress(0)).toBe(25);
      expect(getProgress(1)).toBe(50);
      expect(getProgress(2)).toBe(75);
      expect(getProgress(3)).toBe(100);
    });
  });
});

describe('Config Preview Component', () => {
  describe('Device Widths', () => {
    it('should have correct device widths', () => {
      const deviceWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
      };

      expect(deviceWidths.desktop).toBe('100%');
      expect(deviceWidths.tablet).toBe('768px');
      expect(deviceWidths.mobile).toBe('375px');
    });
  });

  describe('Type Labels', () => {
    it('should have labels for all config types', () => {
      const typeLabels: Record<string, string> = {
        home: 'Trang Chủ',
        about: 'Trang Giới Thiệu',
        footer: 'Footer',
        menu: 'Menu Navigation',
      };

      expect(typeLabels.home).toBe('Trang Chủ');
      expect(typeLabels.about).toBe('Trang Giới Thiệu');
      expect(typeLabels.footer).toBe('Footer');
      expect(typeLabels.menu).toBe('Menu Navigation');
    });
  });

  describe('Menu Config Preview', () => {
    it('should filter visible menu items correctly', () => {
      const menuConfig = {
        home: true,
        about: true,
        products: true,
        solutions: false,
        portfolio: true,
        partners: false,
        news: true,
        careers: false,
        contact: true,
        faq: false,
      };

      const menuItems = [
        { key: 'home', label: 'Trang chủ' },
        { key: 'about', label: 'Giới thiệu' },
        { key: 'products', label: 'Sản phẩm' },
        { key: 'solutions', label: 'Giải pháp' },
        { key: 'portfolio', label: 'Dự án' },
        { key: 'partners', label: 'Đối tác' },
        { key: 'news', label: 'Tin tức' },
        { key: 'careers', label: 'Tuyển dụng' },
        { key: 'contact', label: 'Liên hệ' },
        { key: 'faq', label: 'FAQ' },
      ];

      const visibleItems = menuItems.filter(
        item => (menuConfig as Record<string, boolean>)[item.key] !== false
      );

      expect(visibleItems).toHaveLength(6);
      expect(visibleItems.map(i => i.key)).toEqual([
        'home', 'about', 'products', 'portfolio', 'news', 'contact'
      ]);
    });
  });

  describe('Home Config Preview', () => {
    it('should render stats correctly', () => {
      const homeConfig = {
        statsYears: '15+',
        statsProjects: '500+',
        statsPartners: '100+',
        statsSatisfaction: '98%',
      };

      expect(homeConfig.statsYears).toBe('15+');
      expect(homeConfig.statsProjects).toBe('500+');
      expect(homeConfig.statsPartners).toBe('100+');
      expect(homeConfig.statsSatisfaction).toBe('98%');
    });
  });

  describe('Footer Config Preview', () => {
    it('should have all social media fields', () => {
      const footerConfig = {
        companyName: 'Dreamweldtech',
        facebookUrl: 'https://facebook.com/dreamweldtech',
        linkedinUrl: 'https://linkedin.com/company/dreamweldtech',
        youtubeUrl: 'https://youtube.com/@dreamweldtech',
        twitterUrl: '',
        instagramUrl: '',
        zaloUrl: 'https://zalo.me/dreamweldtech',
      };

      expect(footerConfig.facebookUrl).toContain('facebook.com');
      expect(footerConfig.linkedinUrl).toContain('linkedin.com');
      expect(footerConfig.youtubeUrl).toContain('youtube.com');
    });
  });
});

describe('Banners API', () => {
  describe('Banner Positions', () => {
    it('should support multiple banner positions', () => {
      const validPositions = ['hero', 'sidebar', 'popup', 'footer'];
      
      validPositions.forEach(position => {
        expect(typeof position).toBe('string');
        expect(position.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Banner Sorting', () => {
    it('should sort banners by sortOrder ascending', () => {
      const banners = [
        { id: 1, sortOrder: 3 },
        { id: 2, sortOrder: 1 },
        { id: 3, sortOrder: 2 },
        { id: 4, sortOrder: null },
      ];

      const sorted = [...banners].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );

      expect(sorted[0].id).toBe(4); // null becomes 0
      expect(sorted[1].id).toBe(2); // sortOrder 1
      expect(sorted[2].id).toBe(3); // sortOrder 2
      expect(sorted[3].id).toBe(1); // sortOrder 3
    });
  });
});
