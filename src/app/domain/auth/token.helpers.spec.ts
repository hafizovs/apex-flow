import { describe, it, expect } from 'vitest';
import { TOKEN_PREFIX } from '../../core/constants/auth.constants';
import { generateToken, parseTokenUserId } from './token.helpers';

describe('token.helpers', () => {
  describe('generateToken', () => {
    it('prefixes token with TOKEN_PREFIX', () => {
      const token = generateToken('usr_admin');
      expect(token.startsWith(TOKEN_PREFIX)).toBe(true);
    });

    it('embeds userId after the prefix', () => {
      const userId = 'usr_admin';
      const token = generateToken(userId);
      expect(token.startsWith(`${TOKEN_PREFIX}${userId}_`)).toBe(true);
    });

    it('generates unique tokens for the same userId', () => {
      const a = generateToken('usr_dev');
      const b = generateToken('usr_dev');
      expect(a).not.toBe(b);
    });

    it('generates unique tokens across many calls', () => {
      const tokens = new Set(
        Array.from({ length: 40 }, () => generateToken('usr_manager')),
      );
      expect(tokens.size).toBe(40);
    });
  });

  describe('parseTokenUserId', () => {
    it('returns userId from a generated token', () => {
      const userId = 'usr_admin';
      const token = generateToken(userId);
      expect(parseTokenUserId(token)).toBe(userId);
    });

    it('supports userIds that contain underscores', () => {
      const userId = 'usr_dev2';
      const token = generateToken(userId);
      expect(parseTokenUserId(token)).toBe(userId);
    });

    it('returns null for wrong prefix', () => {
      expect(parseTokenUserId('other_tok_usr_admin_abc')).toBeNull();
    });

    it('returns null for empty or short tokens', () => {
      expect(parseTokenUserId('')).toBeNull();
      expect(parseTokenUserId(TOKEN_PREFIX)).toBeNull();
      expect(parseTokenUserId(`${TOKEN_PREFIX}x_short`)).toBeNull();
    });
  });
});
