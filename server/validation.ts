import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags and scripts
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  
  // Trim whitespace
  return sanitized.trim();
}

/**
 * Sanitize HTML content while preserving safe tags
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
  });
}

/**
 * Validate and sanitize email
 */
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .transform(sanitizeInput);

/**
 * Validate and sanitize phone number
 */
export const phoneSchema = z.string()
  .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
  .min(6, 'Phone number must be at least 6 characters')
  .max(20, 'Phone number must be less than 20 characters')
  .transform(sanitizeInput);

/**
 * Validate and sanitize name
 */
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-'.àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+$/, 'Name contains invalid characters')
  .transform(sanitizeInput);

/**
 * Validate and sanitize message/textarea
 */
export const messageSchema = z.string()
  .min(10, 'Message must be at least 10 characters')
  .max(5000, 'Message must be less than 5000 characters')
  .transform(sanitizeInput);

/**
 * Validate URL
 */
export const urlSchema = z.string()
  .url('Invalid URL')
  .max(2048, 'URL must be less than 2048 characters');

/**
 * Validate slug (for products, news, etc.)
 */
export const slugSchema = z.string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .min(3, 'Slug must be at least 3 characters')
  .max(100, 'Slug must be less than 100 characters');

/**
 * Contact form schema with full validation
 */
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  company: z.string()
    .max(100, 'Company name must be less than 100 characters')
    .transform(sanitizeInput)
    .optional(),
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must be less than 200 characters')
    .transform(sanitizeInput),
  message: messageSchema,
});

/**
 * Newsletter subscription schema
 */
export const newsletterSchema = z.object({
  email: emailSchema,
  name: nameSchema.optional(),
});

/**
 * Job application schema
 */
export const jobApplicationSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  position: z.string()
    .min(1, 'Position is required')
    .max(100, 'Position must be less than 100 characters')
    .transform(sanitizeInput),
  experience: z.string()
    .min(1, 'Experience is required')
    .max(5000, 'Experience must be less than 5000 characters')
    .transform(sanitizeInput),
  coverLetter: messageSchema.optional(),
  resume: z.string()
    .url('Invalid resume URL'),
});

/**
 * Product schema for admin
 */
export const productSchema = z.object({
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must be less than 200 characters')
    .transform(sanitizeInput),
  slug: slugSchema,
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .transform(sanitizeInput),
  price: z.number()
    .positive('Price must be positive')
    .finite('Price must be a valid number'),
  categoryId: z.number()
    .positive('Category ID must be positive'),
  image: urlSchema,
  specifications: z.string()
    .max(5000, 'Specifications must be less than 5000 characters')
    .transform(sanitizeInput)
    .optional(),
});

/**
 * News article schema for admin
 */
export const newsSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters')
    .transform(sanitizeInput),
  slug: slugSchema,
  content: z.string()
    .min(50, 'Content must be at least 50 characters')
    .max(10000, 'Content must be less than 10000 characters')
    .transform(sanitizeInput),
  excerpt: z.string()
    .min(10, 'Excerpt must be at least 10 characters')
    .max(500, 'Excerpt must be less than 500 characters')
    .transform(sanitizeInput),
  image: urlSchema,
  published: z.boolean().optional(),
});

/**
 * Validate and sanitize all form data
 */
export async function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: boolean; data?: T; errors?: Record<string, string> }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}
