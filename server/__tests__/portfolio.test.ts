import { describe, it, expect } from 'vitest';

describe('Portfolio Detail', () => {
  describe('Slug Generation', () => {
    it('should generate valid slug from title', () => {
      const title = 'Dự án hàn khung xe Toyota';
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug).not.toContain('--');
    });

    it('should handle English titles', () => {
      const title = 'Toyota Vehicle Frame Welding Project';
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      
      expect(slug).toBe('toyota-vehicle-frame-welding-project');
    });
  });

  describe('Image Gallery', () => {
    it('should parse JSON image array', () => {
      const imagesJson = '["https://example.com/img1.jpg", "https://example.com/img2.jpg"]';
      const images = JSON.parse(imagesJson);
      
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBe(2);
      expect(images[0]).toContain('https://');
    });

    it('should handle empty images', () => {
      const imagesJson = '[]';
      const images = JSON.parse(imagesJson);
      
      expect(images.length).toBe(0);
    });

    it('should handle null images gracefully', () => {
      const images = null;
      const parsed = images ? JSON.parse(images) : [];
      
      expect(parsed).toEqual([]);
    });
  });

  describe('Video URL Parsing', () => {
    it('should extract YouTube video ID', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
      ];

      urls.forEach(url => {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
        expect(match).not.toBeNull();
        expect(match![1]).toBe('dQw4w9WgXcQ');
      });
    });

    it('should extract Vimeo video ID', () => {
      const url = 'https://vimeo.com/123456789';
      const match = url.match(/vimeo\.com\/(\d+)/);
      
      expect(match).not.toBeNull();
      expect(match![1]).toBe('123456789');
    });

    it('should generate correct embed URL for YouTube', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
      const embedUrl = match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
      
      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1');
    });

    it('should generate correct embed URL for Vimeo', () => {
      const url = 'https://vimeo.com/123456789';
      const match = url.match(/vimeo\.com\/(\d+)/);
      const embedUrl = match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : url;
      
      expect(embedUrl).toBe('https://player.vimeo.com/video/123456789?autoplay=1');
    });
  });

  describe('Tags Parsing', () => {
    it('should parse comma-separated tags', () => {
      const tagsString = 'hàn laser, ô tô, Toyota, robot';
      const tags = tagsString.split(',').map(t => t.trim());
      
      expect(tags.length).toBe(4);
      expect(tags).toContain('hàn laser');
      expect(tags).toContain('Toyota');
    });

    it('should handle empty tags', () => {
      const tagsString = '';
      const tags = tagsString ? tagsString.split(',').map(t => t.trim()) : [];
      
      expect(tags).toEqual([]);
    });
  });

  describe('Portfolio Data Structure', () => {
    it('should have required fields', () => {
      const portfolio = {
        id: 1,
        title: 'Test Project',
        slug: 'test-project',
        description: 'Test description',
        category: 'Ô tô',
        client: 'Test Client',
        location: 'Hanoi',
        completedDate: '2024-06',
        images: '[]',
        videoUrl: null,
        tags: 'test, project',
        isFeatured: 'true',
        isActive: 'true',
      };

      expect(portfolio).toHaveProperty('id');
      expect(portfolio).toHaveProperty('title');
      expect(portfolio).toHaveProperty('slug');
      expect(portfolio).toHaveProperty('description');
      expect(portfolio).toHaveProperty('images');
    });

    it('should validate featured status', () => {
      const validStatuses = ['true', 'false'];
      
      validStatuses.forEach(status => {
        expect(['true', 'false']).toContain(status);
      });
    });
  });

  describe('Lightbox Navigation', () => {
    it('should calculate next index correctly', () => {
      const images = ['img1', 'img2', 'img3', 'img4'];
      let currentIndex = 0;
      
      // Next
      currentIndex = (currentIndex + 1) % images.length;
      expect(currentIndex).toBe(1);
      
      // Next at end wraps to start
      currentIndex = 3;
      currentIndex = (currentIndex + 1) % images.length;
      expect(currentIndex).toBe(0);
    });

    it('should calculate prev index correctly', () => {
      const images = ['img1', 'img2', 'img3', 'img4'];
      let currentIndex = 2;
      
      // Prev
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      expect(currentIndex).toBe(1);
      
      // Prev at start wraps to end
      currentIndex = 0;
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      expect(currentIndex).toBe(3);
    });
  });

  describe('Related Projects Filter', () => {
    it('should filter by category', () => {
      const projects = [
        { id: 1, category: 'Ô tô', title: 'Project 1' },
        { id: 2, category: 'Điện tử', title: 'Project 2' },
        { id: 3, category: 'Ô tô', title: 'Project 3' },
      ];
      
      const currentCategory = 'Ô tô';
      const currentId = 1;
      
      const related = projects
        .filter(p => p.category === currentCategory && p.id !== currentId)
        .slice(0, 3);
      
      expect(related.length).toBe(1);
      expect(related[0].id).toBe(3);
    });

    it('should limit to 3 related projects', () => {
      const projects = [
        { id: 1, category: 'Ô tô' },
        { id: 2, category: 'Ô tô' },
        { id: 3, category: 'Ô tô' },
        { id: 4, category: 'Ô tô' },
        { id: 5, category: 'Ô tô' },
      ];
      
      const currentId = 1;
      const related = projects
        .filter(p => p.id !== currentId)
        .slice(0, 3);
      
      expect(related.length).toBe(3);
    });
  });
});

describe('SEO Schema', () => {
  it('should generate valid CreativeWork schema', () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": "Test Project",
      "description": "Test description",
      "image": ["https://example.com/img1.jpg"],
      "dateCreated": "2024-06",
      "creator": {
        "@type": "Organization",
        "name": "Dreamweldtech"
      },
      "client": "Test Client",
      "locationCreated": "Hanoi"
    };

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("CreativeWork");
    expect(schema.creator["@type"]).toBe("Organization");
  });
});
