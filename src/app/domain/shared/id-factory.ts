import {
  ID_PREFIX_LOG,
  ID_PREFIX_TASK,
  ID_PREFIX_USER,
} from '../../core/constants/auth.constants';

export type IdPrefixKind = 'usr' | 'tsk' | 'log';

const PREFIX_MAP: Record<IdPrefixKind, string> = {
  usr: ID_PREFIX_USER,
  tsk: ID_PREFIX_TASK,
  log: ID_PREFIX_LOG,
};

function randomSegment(length = 10): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

/**
 * Creates a unique id with the canonical prefix: usr_ / tsk_ / log_
 */
export function createId(prefix: IdPrefixKind): string {
  const base = PREFIX_MAP[prefix];
  return `${base}${randomSegment(10)}`;
}
