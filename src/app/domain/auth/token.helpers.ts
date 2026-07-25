import { TOKEN_PREFIX } from '../../core/constants/auth.constants';

const RANDOM_LENGTH = 32;
const RANDOM_ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function cryptoRandomString(length: number): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let result = '';
  for (let i = 0; i < length; i++) {
    result += RANDOM_ALPHABET[bytes[i]! % RANDOM_ALPHABET.length];
  }
  return result;
}

/**
 * Mock JWT-like opaque token: TOKEN_PREFIX + userId + '_' + random(32)
 */
export function generateToken(userId: string): string {
  const random = cryptoRandomString(RANDOM_LENGTH);
  return `${TOKEN_PREFIX}${userId}_${random}`;
}

/**
 * Extracts userId from token string when format matches generateToken.
 * Returns null if prefix/shape invalid.
 */
export function parseTokenUserId(token: string): string | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return null;
  }
  const rest = token.slice(TOKEN_PREFIX.length);
  // rest = userId + '_' + random(32)
  if (rest.length < RANDOM_LENGTH + 2) {
    return null;
  }
  const separatorIndex = rest.length - RANDOM_LENGTH - 1;
  if (rest.charAt(separatorIndex) !== '_') {
    return null;
  }
  const userId = rest.slice(0, separatorIndex);
  if (!userId) {
    return null;
  }
  return userId;
}
