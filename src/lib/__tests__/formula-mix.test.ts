import { bucketTexture } from '@/lib/formula-mix';

describe('bucketTexture', () => {
  it('Test 1: maps PELLET to Pellet', () => {
    expect(bucketTexture('PELLET')).toBe('Pellet');
  });

  it('Test 2: maps SH PELLET to Pellet', () => {
    expect(bucketTexture('SH PELLET')).toBe('Pellet');
  });

  it('Test 3: maps MASH to Mash', () => {
    expect(bucketTexture('MASH')).toBe('Mash');
  });

  it('Test 4: maps FINE CR to Crumble', () => {
    expect(bucketTexture('FINE CR')).toBe('Crumble');
  });

  it('Test 5: maps C. CRUMBLE to Crumble', () => {
    expect(bucketTexture('C. CRUMBLE')).toBe('Crumble');
  });

  it('Test 6: returns null for null input', () => {
    expect(bucketTexture(null)).toBe(null);
  });

  it('Test 7 (case sensitivity, D-11): lowercase pellet returns null — not recognized', () => {
    expect(bucketTexture('pellet')).toBe(null);
  });

  it('Test 8 (case sensitivity): title-case Pellet returns null — only canonical UPPERCASE DB form is mapped', () => {
    expect(bucketTexture('Pellet')).toBe(null);
  });

  it('Test 9 (whitespace): trailing space is NOT trimmed — returns null', () => {
    expect(bucketTexture('PELLET ')).toBe(null);
  });

  it('Test 10 (unrecognized): unknown texture CHUNKY returns null', () => {
    expect(bucketTexture('CHUNKY')).toBe(null);
  });

  it('Test 11 (empty string): empty string is not recognized — returns null', () => {
    expect(bucketTexture('')).toBe(null);
  });
});
