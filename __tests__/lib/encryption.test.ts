process.env.PERSONNUMMER_ENCRYPTION_KEY =
  process.env.PERSONNUMMER_ENCRYPTION_KEY ||
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

import {
  encryptPersonnummer,
  decryptPersonnummer,
  normalisePersonnummer,
  isValidPersonnummer,
  maskPersonnummer,
} from '@/lib/encryption';

describe('personnummer encryption + helpers', () => {
  it('round-trips encrypt/decrypt', () => {
    const pnr = normalisePersonnummer('900101-1234');
    const enc = encryptPersonnummer(pnr);
    expect(enc).not.toContain('1234');
    expect(decryptPersonnummer(enc)).toBe(pnr);
  });

  it('normalises 10- and 12-digit forms', () => {
    expect(normalisePersonnummer('19900101-1234')).toBe('199001011234');
    expect(normalisePersonnummer('9001011234')).toBe('199001011234');
  });

  it('validates format', () => {
    expect(isValidPersonnummer('900101-1234')).toBe(true);
    expect(isValidPersonnummer('nonsense')).toBe(false);
    expect(isValidPersonnummer('123')).toBe(false);
  });

  it('masks the last four digits', () => {
    expect(maskPersonnummer('199001011234')).toBe('19900101-••••');
  });
});
