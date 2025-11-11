import { describe, it, expect } from 'vitest';
import { isContractActiveOnDate, computeCurrentMrr, computeContractsByMonth } from './analytics';
import { addMonths, formatISO } from 'date-fns';

const today = new Date();

describe('analytics utilities', () => {
  it('isContractActiveOnDate should detect active contracts correctly', () => {
    const start = formatISO(addMonths(today, -1));
    const contract: any = {
      id: '1',
      startDate: start,
      contractDuration: '3_months',
      ticketValue: '900',
      paymentFrequency: 'monthly',
    };

    expect(isContractActiveOnDate(contract, today)).toBe(true);
    expect(isContractActiveOnDate(contract, addMonths(today, 3))).toBe(false);
  });

  it('computeCurrentMrr excludes one_time and sums recurring MRR', () => {
    const recurringStart = formatISO(addMonths(today, -1));
    const recurring: any = {
      id: 'r1',
      startDate: recurringStart,
      contractDuration: '3_months',
      ticketValue: '900',
      paymentFrequency: 'monthly',
      product: 'all',
    };

    const oneTimeStart = formatISO(addMonths(today, -1));
    const oneTime: any = {
      id: 'o1',
      startDate: oneTimeStart,
      contractDuration: '3_months',
      ticketValue: '1200',
      paymentFrequency: 'one_time',
      product: 'all',
    };

    const mrr = computeCurrentMrr([recurring, oneTime], today);
    // recurring: 900 / 3 months = 300
    expect(mrr).toBeCloseTo(300);
  });

  it('computeContractsByMonth returns correct shape and values', () => {
    const c1Start = formatISO(addMonths(today, -2));
    const c1: any = {
      id: 'c1',
      startDate: c1Start,
      contractDuration: '3_months',
      ticketValue: '900',
      paymentFrequency: 'monthly',
      product: 'p1',
    };

    const c2Start = formatISO(addMonths(today, -1));
    const c2: any = {
      id: 'c2',
      startDate: c2Start,
      contractDuration: '1_year',
      ticketValue: '1200',
      paymentFrequency: 'monthly',
      product: 'p2',
    };

    const results = computeContractsByMonth([c1, c2], 3, today);
    expect(results.length).toBe(3);
    // each result has month, date, contratos, faturamento, mrr
    results.forEach((r) => {
      expect(r).toHaveProperty('month');
      expect(r).toHaveProperty('date');
      expect(r).toHaveProperty('contratos');
      expect(r).toHaveProperty('faturamento');
      expect(r).toHaveProperty('mrr');
    });
  });
});
