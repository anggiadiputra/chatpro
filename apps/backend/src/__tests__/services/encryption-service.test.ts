import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock environment
const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
  process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
});

afterEach(() => {
  process.env = originalEnv;
});

describe('EncryptionService', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt string values', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      const plaintext = 'my-secret-api-key-12345';
      const encrypted = service.encryptToString(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = service.decryptFromString(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (IV randomness)', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      const plaintext = 'same-secret-value';
      const encrypted1 = service.encryptToString(plaintext);
      const encrypted2 = service.encryptToString(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      // Both should decrypt to same value
      expect(service.decryptFromString(encrypted1)).toBe(plaintext);
      expect(service.decryptFromString(encrypted2)).toBe(plaintext);
    });

    it('should throw error for empty strings', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      expect(() => service.encryptToString('')).toThrow('Value must be a non-empty string');
    });

    it('should handle special characters', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';
      const encrypted = service.encryptToString(plaintext);
      const decrypted = service.decryptFromString(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      const plaintext = '日本語テスト 🔐 émojis';
      const encrypted = service.encryptToString(plaintext);
      const decrypted = service.decryptFromString(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      const plaintext = 'a'.repeat(10000);
      const encrypted = service.encryptToString(plaintext);
      const decrypted = service.decryptFromString(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('mask', () => {
    it('should mask sensitive values showing last 4 chars', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      const result = service.mask('my-secret-api-key');
      // Shows last 4 chars with asterisks before
      expect(result).toContain('-key');
      expect(result).toContain('*');
    });

    it('should handle short strings by masking all chars', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      // Strings <= 4 chars get fully masked with same length
      expect(service.mask('ab')).toBe('**');
      expect(service.mask('abc')).toBe('***');
      expect(service.mask('abcd')).toBe('****');
      // Strings > 4 chars show last 4
      expect(service.mask('abcde')).toContain('bcde');
    });

    it('should return **** for empty/invalid strings', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      expect(service.mask('')).toBe('****');
      expect(service.mask(null as any)).toBe('****');
      expect(service.mask(undefined as any)).toBe('****');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid encrypted data', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      expect(() => service.decryptFromString('invalid-data')).toThrow();
    });

    it('should throw error for tampered ciphertext', async () => {
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const service = new EncryptionService();

      const encrypted = service.encryptToString('secret');
      const tampered = encrypted.slice(0, -5) + 'xxxxx';

      expect(() => service.decryptFromString(tampered)).toThrow();
    });
  });
});
