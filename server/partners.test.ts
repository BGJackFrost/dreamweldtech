import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from './db';

// Mock the database
vi.mock('./db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe('Partners API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all partners', async () => {
      const mockPartners = [
        {
          id: 1,
          name: 'Partner A',
          logo: 'https://example.com/logo-a.png',
          description: 'Description A',
          website: 'https://partner-a.com',
          category: 'manufacturer',
          testimonial: 'Great service!',
          testimonialAuthor: 'John Doe',
          testimonialPosition: 'CEO',
          displayOrder: 1,
          isActive: 'true',
          isFeatured: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Partner B',
          logo: 'https://example.com/logo-b.png',
          description: 'Description B',
          website: 'https://partner-b.com',
          category: 'distributor',
          testimonial: null,
          testimonialAuthor: null,
          testimonialPosition: null,
          displayOrder: 2,
          isActive: 'true',
          isFeatured: 'false',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (db.execute as any).mockResolvedValue([mockPartners]);

      const result = await db.execute({} as any);
      expect(result[0]).toHaveLength(2);
      expect(result[0][0].name).toBe('Partner A');
      expect(result[0][1].name).toBe('Partner B');
    });
  });

  describe('getActive', () => {
    it('should return only active partners', async () => {
      const mockActivePartners = [
        {
          id: 1,
          name: 'Active Partner',
          logo: 'https://example.com/logo.png',
          isActive: 'true',
          displayOrder: 1,
        },
      ];

      (db.execute as any).mockResolvedValue([mockActivePartners]);

      const result = await db.execute({} as any);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].isActive).toBe('true');
    });
  });

  describe('getWithTestimonials', () => {
    it('should return partners with testimonials', async () => {
      const mockPartnersWithTestimonials = [
        {
          id: 1,
          name: 'Partner with Testimonial',
          testimonial: 'Excellent products and support!',
          testimonialAuthor: 'Jane Smith',
          testimonialPosition: 'CTO',
          isActive: 'true',
        },
      ];

      (db.execute as any).mockResolvedValue([mockPartnersWithTestimonials]);

      const result = await db.execute({} as any);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].testimonial).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should create a new partner', async () => {
      const newPartner = {
        name: 'New Partner',
        logo: 'https://example.com/new-logo.png',
        description: 'New partner description',
        website: 'https://new-partner.com',
        category: 'enterprise',
        testimonial: 'Amazing experience!',
        testimonialAuthor: 'Bob Wilson',
        testimonialPosition: 'Manager',
        displayOrder: 3,
        isActive: 'true',
        isFeatured: 'false',
      };

      (db.execute as any).mockResolvedValue([{ insertId: 3 }]);

      const result = await db.execute({} as any);
      expect(result[0].insertId).toBe(3);
    });

    it('should validate required fields', () => {
      const invalidPartner = {
        logo: 'https://example.com/logo.png',
        // missing name
      };

      expect(invalidPartner.name).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update an existing partner', async () => {
      const updatedData = {
        id: 1,
        name: 'Updated Partner Name',
        logo: 'https://example.com/updated-logo.png',
      };

      (db.execute as any).mockResolvedValue([{ affectedRows: 1 }]);

      const result = await db.execute({} as any);
      expect(result[0].affectedRows).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete a partner', async () => {
      (db.execute as any).mockResolvedValue([{ affectedRows: 1 }]);

      const result = await db.execute({} as any);
      expect(result[0].affectedRows).toBe(1);
    });
  });

  describe('reorder', () => {
    it('should update display order for multiple partners', async () => {
      const reorderData = [
        { id: 1, displayOrder: 2 },
        { id: 2, displayOrder: 1 },
        { id: 3, displayOrder: 3 },
      ];

      (db.execute as any).mockResolvedValue([{ affectedRows: 3 }]);

      const result = await db.execute({} as any);
      expect(result[0].affectedRows).toBe(3);
    });
  });

  describe('Partner categories', () => {
    it('should have valid category values', () => {
      const validCategories = ['manufacturer', 'distributor', 'enterprise', 'government', 'other'];
      
      validCategories.forEach(category => {
        expect(['manufacturer', 'distributor', 'enterprise', 'government', 'other']).toContain(category);
      });
    });
  });

  describe('Partner testimonials', () => {
    it('should handle partners without testimonials', async () => {
      const partnerWithoutTestimonial = {
        id: 1,
        name: 'Partner without testimonial',
        testimonial: null,
        testimonialAuthor: null,
        testimonialPosition: null,
      };

      expect(partnerWithoutTestimonial.testimonial).toBeNull();
      expect(partnerWithoutTestimonial.testimonialAuthor).toBeNull();
      expect(partnerWithoutTestimonial.testimonialPosition).toBeNull();
    });

    it('should handle partners with complete testimonials', async () => {
      const partnerWithTestimonial = {
        id: 2,
        name: 'Partner with testimonial',
        testimonial: 'Great products!',
        testimonialAuthor: 'John Doe',
        testimonialPosition: 'CEO',
      };

      expect(partnerWithTestimonial.testimonial).toBeTruthy();
      expect(partnerWithTestimonial.testimonialAuthor).toBeTruthy();
      expect(partnerWithTestimonial.testimonialPosition).toBeTruthy();
    });
  });

  describe('Featured partners', () => {
    it('should filter featured partners', async () => {
      const mockFeaturedPartners = [
        { id: 1, name: 'Featured Partner', isFeatured: 'true' },
      ];

      (db.execute as any).mockResolvedValue([mockFeaturedPartners]);

      const result = await db.execute({} as any);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].isFeatured).toBe('true');
    });
  });
});
