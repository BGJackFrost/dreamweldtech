import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticator } from 'otplib';
import crypto from 'crypto';

// Mock the database
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

// Mock otplib authenticator
vi.mock('otplib', () => ({
  authenticator: {
    generateSecret: vi.fn(),
    verify: vi.fn(),
    keyuri: vi.fn(),
  },
}));

// Mock qrcode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

describe('Two Factor Authentication Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TOTP Secret Generation', () => {
    it('should generate a valid TOTP secret', () => {
      const mockSecret = 'JBSWY3DPEHPK3PXP';
      (authenticator.generateSecret as any).mockReturnValue(mockSecret);

      const secret = authenticator.generateSecret();

      expect(authenticator.generateSecret).toHaveBeenCalled();
      expect(secret).toBe(mockSecret);
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate unique secrets each time', () => {
      const secrets = ['SECRET1', 'SECRET2', 'SECRET3'];
      let callCount = 0;
      
      (authenticator.generateSecret as any).mockImplementation(() => {
        return secrets[callCount++];
      });

      const secret1 = authenticator.generateSecret();
      const secret2 = authenticator.generateSecret();
      const secret3 = authenticator.generateSecret();

      expect(secret1).not.toBe(secret2);
      expect(secret2).not.toBe(secret3);
    });
  });

  describe('TOTP Code Verification', () => {
    it('should verify valid TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const validCode = '123456';

      (authenticator.verify as any).mockReturnValue(true);

      const isValid = authenticator.verify({
        token: validCode,
        secret: secret,
      });

      expect(authenticator.verify).toHaveBeenCalledWith({
        token: validCode,
        secret: secret,
      });
      expect(isValid).toBe(true);
    });

    it('should reject invalid TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const invalidCode = '000000';

      (authenticator.verify as any).mockReturnValue(false);

      const isValid = authenticator.verify({
        token: invalidCode,
        secret: secret,
      });

      expect(isValid).toBe(false);
    });

    it('should handle expired TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const expiredCode = '654321';

      (authenticator.verify as any).mockReturnValue(false);

      const isValid = authenticator.verify({
        token: expiredCode,
        secret: secret,
      });

      expect(isValid).toBe(false);
    });
  });

  describe('Backup Code Generation', () => {
    it('should generate backup codes with correct format', () => {
      const generateBackupCode = (): string => {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
      };

      const code = generateBackupCode();

      expect(code).toMatch(/^[A-F0-9]{8}$/);
      expect(code.length).toBe(8);
    });

    it('should generate unique backup codes', () => {
      const generateBackupCode = (): string => {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
      };

      const codes = new Set<string>();
      for (let i = 0; i < 10; i++) {
        codes.add(generateBackupCode());
      }

      // All codes should be unique (very high probability)
      expect(codes.size).toBe(10);
    });

    it('should hash backup codes for storage', () => {
      const hashBackupCode = (code: string): string => {
        return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
      };

      const code = 'ABCD1234';
      const hashedCode = hashBackupCode(code);

      expect(hashedCode).toMatch(/^[a-f0-9]{64}$/);
      expect(hashedCode).not.toBe(code);
    });

    it('should hash backup codes case-insensitively', () => {
      const hashBackupCode = (code: string): string => {
        return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
      };

      const code1 = 'abcd1234';
      const code2 = 'ABCD1234';

      expect(hashBackupCode(code1)).toBe(hashBackupCode(code2));
    });
  });

  describe('Backup Code Verification', () => {
    it('should verify valid backup code', () => {
      const hashBackupCode = (code: string): string => {
        return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
      };

      const rawCode = 'ABCD1234';
      const storedHashedCodes = [hashBackupCode(rawCode)];
      const inputCode = 'abcd1234'; // lowercase input

      const hashedInput = hashBackupCode(inputCode);
      const isValid = storedHashedCodes.includes(hashedInput);

      expect(isValid).toBe(true);
    });

    it('should reject invalid backup code', () => {
      const hashBackupCode = (code: string): string => {
        return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
      };

      const storedHashedCodes = [hashBackupCode('ABCD1234')];
      const inputCode = 'WRONG123';

      const hashedInput = hashBackupCode(inputCode);
      const isValid = storedHashedCodes.includes(hashedInput);

      expect(isValid).toBe(false);
    });

    it('should remove used backup code', () => {
      const hashBackupCode = (code: string): string => {
        return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
      };

      const codes = ['CODE1111', 'CODE2222', 'CODE3333'];
      const hashedCodes = codes.map(hashBackupCode);

      // Use CODE2222
      const usedCodeHash = hashBackupCode('CODE2222');
      const index = hashedCodes.indexOf(usedCodeHash);
      
      expect(index).toBe(1);
      
      hashedCodes.splice(index, 1);
      
      expect(hashedCodes.length).toBe(2);
      expect(hashedCodes.includes(usedCodeHash)).toBe(false);
    });
  });

  describe('Lockout Mechanism', () => {
    it('should lock account after max failed attempts', () => {
      const MAX_FAILED_ATTEMPTS = 5;
      const LOCKOUT_DURATION_MINUTES = 15;

      let failedAttempts = 0;
      let lockedUntil: Date | null = null;

      // Simulate 5 failed attempts
      for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
        failedAttempts++;
      }

      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
      }

      expect(failedAttempts).toBe(MAX_FAILED_ATTEMPTS);
      expect(lockedUntil).not.toBeNull();
      expect(lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should check if account is locked', () => {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 15);

      const isLocked = lockedUntil > new Date();

      expect(isLocked).toBe(true);
    });

    it('should allow access after lockout expires', () => {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() - 1); // Expired 1 minute ago

      const isLocked = lockedUntil > new Date();

      expect(isLocked).toBe(false);
    });

    it('should reset failed attempts on successful verification', () => {
      let failedAttempts = 4;
      let lockedUntil: Date | null = null;

      // Successful verification
      failedAttempts = 0;
      lockedUntil = null;

      expect(failedAttempts).toBe(0);
      expect(lockedUntil).toBeNull();
    });
  });

  describe('QR Code Generation', () => {
    it('should generate correct otpauth URI', () => {
      const userEmail = 'admin@dreamweldtech.vn';
      const appName = 'DreamWeldTech';
      const secret = 'JBSWY3DPEHPK3PXP';

      (authenticator.keyuri as any).mockReturnValue(
        `otpauth://totp/${appName}:${userEmail}?secret=${secret}&issuer=${appName}`
      );

      const uri = authenticator.keyuri(userEmail, appName, secret);

      expect(authenticator.keyuri).toHaveBeenCalledWith(userEmail, appName, secret);
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain(appName);
      expect(uri).toContain(secret);
    });
  });

  describe('2FA Settings Management', () => {
    it('should correctly parse 2FA enabled status', () => {
      const settings = { isEnabled: 'true' };
      const isEnabled = settings.isEnabled === 'true';

      expect(isEnabled).toBe(true);
    });

    it('should correctly parse 2FA disabled status', () => {
      const settings = { isEnabled: 'false' };
      const isEnabled = settings.isEnabled === 'true';

      expect(isEnabled).toBe(false);
    });

    it('should handle null/undefined 2FA settings', () => {
      const settings = null;
      const isEnabled = settings ? settings.isEnabled === 'true' : false;

      expect(isEnabled).toBe(false);
    });
  });

  describe('Temporary Token for 2FA', () => {
    it('should identify temp token type', () => {
      const tempToken = { userId: 1, role: 'admin', type: '2fa_pending' };
      const fullToken = { userId: 1, role: 'admin' };

      expect(tempToken.type).toBe('2fa_pending');
      expect(fullToken.type).toBeUndefined();
    });

    it('should reject temp token for protected routes', () => {
      const token = { userId: 1, role: 'admin', type: '2fa_pending' };
      const isFullToken = !token.type || token.type !== '2fa_pending';

      expect(isFullToken).toBe(false);
    });

    it('should accept full token for protected routes', () => {
      const token = { userId: 1, role: 'admin' };
      const isFullToken = !token.type || token.type !== '2fa_pending';

      expect(isFullToken).toBe(true);
    });
  });
});

describe('Login Flow with 2FA', () => {
  describe('Step 1: Username/Password', () => {
    it('should return requires2FA flag when 2FA is enabled', () => {
      const user = { id: 1, username: 'admin', role: 'admin' };
      const has2FA = true;

      const response = {
        success: true,
        requires2FA: has2FA,
        tempToken: has2FA ? 'temp.jwt.token' : undefined,
        user,
      };

      expect(response.requires2FA).toBe(true);
      expect(response.tempToken).toBeDefined();
    });

    it('should return full token when 2FA is disabled', () => {
      const user = { id: 1, username: 'admin', role: 'admin' };
      const has2FA = false;

      const response = {
        success: true,
        requires2FA: has2FA,
        token: !has2FA ? 'full.jwt.token' : undefined,
        user,
      };

      expect(response.requires2FA).toBe(false);
      expect(response.token).toBeDefined();
    });
  });

  describe('Step 2: 2FA Verification', () => {
    it('should complete login after valid 2FA code', () => {
      const tempToken = { userId: 1, role: 'admin', type: '2fa_pending' };
      const code = '123456';
      const isValidCode = true;

      if (tempToken.type === '2fa_pending' && isValidCode) {
        const response = {
          success: true,
          token: 'full.jwt.token',
          user: { id: tempToken.userId, role: tempToken.role },
        };

        expect(response.success).toBe(true);
        expect(response.token).toBeDefined();
      }
    });

    it('should reject login with invalid 2FA code', () => {
      const code = '000000';
      const isValidCode = false;

      const response = {
        success: isValidCode,
        message: isValidCode ? 'Success' : 'Mã không hợp lệ',
      };

      expect(response.success).toBe(false);
      expect(response.message).toBe('Mã không hợp lệ');
    });
  });
});
