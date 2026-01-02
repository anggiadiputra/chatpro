import { describe, it, expect, beforeEach } from 'vitest';
import { TokenEncryptionService } from '../../utils/tokenEncryption';

describe('TokenEncryptionService', () => {
  let service: TokenEncryptionService;
  const testKey = Buffer.from('a'.repeat(32)).toString('base64');

  beforeEach(() => {
    service = new TokenEncryptionService(testKey);
  });

  describe('encrypt', () => {
    it('should encrypt a token successfully', () => {
      const token = 'test_access_token_12345';
      const encrypted = service.encrypt(token);

      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.ciphertext).not.toBe(token);
    });

    it('should generate unique IV for each encryption', () => {
      const token = 'test_access_token_12345';
      const encrypted1 = service.encrypt(token);
      const encrypted2 = service.encrypt(token);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });

    it('should throw error for empty token', () => {
      expect(() => service.encrypt('')).toThrow('Token must be a non-empty string');
    });

    it('should throw error for non-string token', () => {
      expect(() => service.encrypt(null as any)).toThrow('Token must be a non-empty string');
      expect(() => service.encrypt(undefined as any)).toThrow('Token must be a non-empty string');
      expect(() => service.encrypt(123 as any)).toThrow('Token must be a non-empty string');
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted token successfully', () => {
      const originalToken = 'test_access_token_12345';
      const encrypted = service.encrypt(originalToken);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(originalToken);
    });

    it('should decrypt tokens with special characters', () => {
      const originalToken = 'token_with_special_chars_!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(originalToken);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(originalToken);
    });

    it('should throw error for invalid ciphertext', () => {
      const encrypted = service.encrypt('test_token');
      encrypted.ciphertext = 'invalid_ciphertext';

      expect(() => service.decrypt(encrypted)).toThrow('Decryption failed');
    });

    it('should throw error for invalid auth tag', () => {
      const encrypted = service.encrypt('test_token');
      encrypted.authTag = Buffer.from('invalid_tag').toString('base64');

      expect(() => service.decrypt(encrypted)).toThrow('Decryption failed');
    });

    it('should throw error for tampered IV', () => {
      const encrypted = service.encrypt('test_token');
      encrypted.iv = Buffer.from('tampered_iv_1234').toString('base64');

      expect(() => service.decrypt(encrypted)).toThrow('Decryption failed');
    });

    it('should throw error for missing fields', () => {
      expect(() => service.decrypt({} as any)).toThrow();
      expect(() => service.decrypt(null as any)).toThrow('Invalid encrypted token object');
    });

    it('should throw error for unsupported algorithm', () => {
      const encrypted = service.encrypt('test_token');
      encrypted.algorithm = 'aes-128-cbc' as any;

      expect(() => service.decrypt(encrypted)).toThrow('Unsupported algorithm');
    });
  });

  describe('generateKey', () => {
    it('should generate a valid 256-bit key', () => {
      const key = TokenEncryptionService.generateKey();
      const keyBuffer = Buffer.from(key, 'base64');

      expect(keyBuffer.length).toBe(32); // 256 bits = 32 bytes
    });

    it('should generate unique keys', () => {
      const key1 = TokenEncryptionService.generateKey();
      const key2 = TokenEncryptionService.generateKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('constructor', () => {
    it('should throw error for invalid key length', () => {
      const shortKey = Buffer.from('short').toString('base64');
      expect(() => new TokenEncryptionService(shortKey)).toThrow('Encryption key must be 32 bytes');
    });

    it('should throw error when key is not provided', () => {
      delete process.env.WABA_TOKEN_ENCRYPTION_KEY;
      expect(() => new TokenEncryptionService()).toThrow('WABA_TOKEN_ENCRYPTION_KEY environment variable is required');
      
      // Restore for other tests
      process.env.WABA_TOKEN_ENCRYPTION_KEY = testKey;
    });
  });
});
