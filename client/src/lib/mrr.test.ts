import { describe, it, expect } from 'vitest';
import { parseTicketValue, calculateMRR } from './mrr';

describe('parseTicketValue', () => {
  it('parses BR formatted values correctly', () => {
    expect(parseTicketValue('1.234,56')).toBeCloseTo(1234.56);
    expect(parseTicketValue('2.000')).toBeCloseTo(2000);
    expect(parseTicketValue('300,75')).toBeCloseTo(300.75);
  });

  it('parses EN formatted values correctly', () => {
    expect(parseTicketValue('1234.56')).toBeCloseTo(1234.56);
    expect(parseTicketValue('2000')).toBeCloseTo(2000);
  });
});

describe('calculateMRR', () => {
  it('divides total by duration', () => {
    expect(calculateMRR(1200, 12, 'monthly')).toBeCloseTo(100);
    expect(calculateMRR(600, 6, 'monthly')).toBeCloseTo(100);
  });

  it('guards division by zero', () => {
    expect(calculateMRR(1000, 0, 'monthly')).toBeCloseTo(1000);
  });
});
