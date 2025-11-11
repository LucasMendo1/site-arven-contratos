import { parseISO, addMonths } from 'date-fns';
import { parseTicketValue, calculateMRR, durationMonths } from './mrr';

export type Contract = {
  id: string;
  startDate: string;
  contractDuration: keyof typeof durationMonths | string;
  ticketValue: string;
  paymentFrequency: string;
  product?: string;
};

export const isContractActiveOnDate = (contract: Contract, date: Date): boolean => {
  try {
    const start = parseISO(contract.startDate);
    if (isNaN(start.getTime())) return false;
    const months = durationMonths[contract.contractDuration as keyof typeof durationMonths] || 1;
    const end = addMonths(start, months);
    return start <= date && date < end;
  } catch (e) {
    return false;
  }
};

export const computeCurrentMrr = (contracts: Contract[], asOfDate: Date, productFilter = 'all', durationFilter = 'all') => {
  return contracts.reduce((sum, c) => {
    if (productFilter !== 'all' && c.product !== productFilter) return sum;
    if (durationFilter !== 'all' && c.contractDuration !== durationFilter) return sum;
    if (!isContractActiveOnDate(c, asOfDate)) return sum;
    if (c.paymentFrequency === 'one_time') return sum;
    const ticket = parseTicketValue(c.ticketValue);
    const duration = durationMonths[c.contractDuration as keyof typeof durationMonths] || 1;
    return sum + calculateMRR(ticket, duration, c.paymentFrequency as any);
  }, 0);
};

export const computeContractsByMonth = (contracts: Contract[], monthsBack: number, asOfDate: Date, productFilter = 'all', durationFilter = 'all') => {
  const results: Array<{ month: string; date: Date; contratos: number; faturamento: number; mrr: number }> = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = addMonths(asOfDate, -i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthContracts = contracts.filter((c) => {
      if (productFilter !== 'all' && c.product !== productFilter) return false;
      if (durationFilter !== 'all' && c.contractDuration !== durationFilter) return false;
      const start = parseISO(c.startDate);
      const months = durationMonths[c.contractDuration as keyof typeof durationMonths] || 1;
      const end = addMonths(start, months);
      return start <= monthEnd && end > monthStart;
    });

    const faturamento = monthContracts.reduce((s, c) => s + parseTicketValue(c.ticketValue), 0);
    const mrr = monthContracts.reduce((s, c) => {
      if (c.paymentFrequency === 'one_time') return s;
      const ticket = parseTicketValue(c.ticketValue);
      const duration = durationMonths[c.contractDuration as keyof typeof durationMonths] || 1;
      return s + calculateMRR(ticket, duration, c.paymentFrequency as any);
    }, 0);

    results.push({ month: monthStart.toISOString(), date: monthStart, contratos: monthContracts.length, faturamento, mrr });
  }
  return results;
};

export default { isContractActiveOnDate, computeCurrentMrr, computeContractsByMonth };
