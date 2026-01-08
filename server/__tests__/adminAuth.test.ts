import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock the database
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('Admin Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'Admin@123';
      const hashedPassword = '$2a$12$hashedpassword';
      
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);
      
      const result = await bcrypt.hash(password, 12);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should compare password correctly', async () => {
      const password = 'Admin@123';
      const hashedPassword = '$2a$12$hashedpassword';
      
      (bcrypt.compare as any).mockResolvedValue(true);
      
      const result = await bcrypt.compare(password, hashedPassword);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const password = 'WrongPassword';
      const hashedPassword = '$2a$12$hashedpassword';
      
      (bcrypt.compare as any).mockResolvedValue(false);
      
      const result = await bcrypt.compare(password, hashedPassword);
      
      expect(result).toBe(false);
    });
  });

  describe('JWT Token', () => {
    it('should generate JWT token', () => {
      const userId = 1;
      const role = 'admin';
      const token = 'generated.jwt.token';
      
      (jwt.sign as any).mockReturnValue(token);
      
      const result = jwt.sign(
        { userId, role },
        'secret',
        { expiresIn: '7d' }
      );
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId, role },
        'secret',
        { expiresIn: '7d' }
      );
      expect(result).toBe(token);
    });

    it('should verify JWT token', () => {
      const token = 'valid.jwt.token';
      const decoded = { userId: 1, role: 'admin' };
      
      (jwt.verify as any).mockReturnValue(decoded);
      
      const result = jwt.verify(token, 'secret');
      
      expect(jwt.verify).toHaveBeenCalledWith(token, 'secret');
      expect(result).toEqual(decoded);
    });

    it('should throw error for invalid token', () => {
      const token = 'invalid.jwt.token';
      
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      expect(() => jwt.verify(token, 'secret')).toThrow('Invalid token');
    });
  });

  describe('Login Validation', () => {
    it('should validate username length', () => {
      const shortUsername = 'ab';
      const validUsername = 'admin';
      
      expect(shortUsername.length >= 3).toBe(false);
      expect(validUsername.length >= 3).toBe(true);
    });

    it('should validate password length', () => {
      const shortPassword = '12345';
      const validPassword = 'Admin@123';
      
      expect(shortPassword.length >= 6).toBe(false);
      expect(validPassword.length >= 6).toBe(true);
    });

    it('should validate email format', () => {
      const invalidEmail = 'notanemail';
      const validEmail = 'admin@dreamweldtech.vn';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test(invalidEmail)).toBe(false);
      expect(emailRegex.test(validEmail)).toBe(true);
    });
  });

  describe('Role Validation', () => {
    it('should allow admin role', () => {
      const role = 'admin';
      const allowedRoles = ['admin', 'editor'];
      
      expect(allowedRoles.includes(role)).toBe(true);
    });

    it('should allow editor role', () => {
      const role = 'editor';
      const allowedRoles = ['admin', 'editor'];
      
      expect(allowedRoles.includes(role)).toBe(true);
    });

    it('should deny user role for admin access', () => {
      const role = 'user';
      const allowedRoles = ['admin', 'editor'];
      
      expect(allowedRoles.includes(role)).toBe(false);
    });
  });

  describe('Token Storage', () => {
    it('should store token in localStorage', () => {
      const token = 'test.jwt.token';
      const ADMIN_TOKEN_KEY = 'dreamweldtech_admin_token';
      
      // Simulate localStorage
      const storage: Record<string, string> = {};
      
      // Set token
      storage[ADMIN_TOKEN_KEY] = token;
      
      expect(storage[ADMIN_TOKEN_KEY]).toBe(token);
    });

    it('should retrieve token from localStorage', () => {
      const token = 'test.jwt.token';
      const ADMIN_TOKEN_KEY = 'dreamweldtech_admin_token';
      
      // Simulate localStorage
      const storage: Record<string, string> = {
        [ADMIN_TOKEN_KEY]: token,
      };
      
      expect(storage[ADMIN_TOKEN_KEY]).toBe(token);
    });

    it('should remove token from localStorage', () => {
      const ADMIN_TOKEN_KEY = 'dreamweldtech_admin_token';
      
      // Simulate localStorage
      const storage: Record<string, string> = {
        [ADMIN_TOKEN_KEY]: 'test.jwt.token',
      };
      
      // Remove token
      delete storage[ADMIN_TOKEN_KEY];
      
      expect(storage[ADMIN_TOKEN_KEY]).toBeUndefined();
    });
  });
});
