import { describe, it, expect } from 'vitest';
import { toDateOrNull } from './dates';

describe('toDateOrNull', () => {
  it('returns null for a null value', () => {
    expect(toDateOrNull(null)).toBeNull();
  });

  it('passes a Date instance through unchanged', () => {
    const date = new Date(2026, 0, 15);
    expect(toDateOrNull(date)).toBe(date);
  });

  it('parses a YYYY-MM-DD string as a local date, not UTC', () => {
    const result = toDateOrNull('2026-01-15');
    expect(result).toEqual(new Date(2026, 0, 15));
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(0);
    expect(result?.getDate()).toBe(15);
    expect(result?.getHours()).toBe(0);
  });

  it('does not shift to the previous day near the UTC-3 midnight boundary', () => {
    const result = toDateOrNull('2026-01-01');
    expect(result?.getDate()).toBe(1);
    expect(result?.getMonth()).toBe(0);
  });
});
