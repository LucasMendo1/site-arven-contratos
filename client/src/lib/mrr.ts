export type PaymentFrequency = "monthly" | "quarterly" | "biannual" | "annual" | "one_time";

export const durationMonths: Record<string, number> = {
  "3_months": 3,
  "6_months": 6,
  "1_year": 12,
  "2_years": 24,
};

export const parseTicketValue = (value: string): number => {
  if (!value) return 0;
  const raw = String(value).trim();
  const cleaned = raw.replace(/[^\d.,]/g, "");

  // If both dot and comma exist, assume dot is thousand separator and comma is decimal (BR)
  if (cleaned.indexOf('.') !== -1 && cleaned.indexOf(',') !== -1) {
    const withoutDots = cleaned.replace(/\./g, '');
    const normalized = withoutDots.replace(/,/g, '.');
    return parseFloat(normalized) || 0;
  }

  // If only dot exists (no comma), decide if dot is thousand separator.
  // Heuristic: if the last group after the dot has exactly 3 digits, treat dots as thousand separators.
  if (cleaned.indexOf('.') !== -1 && cleaned.indexOf(',') === -1) {
    const parts = cleaned.split('.');
    const lastLen = parts[parts.length - 1].length;
    if (lastLen === 3) {
      return parseFloat(cleaned.replace(/\./g, '')) || 0;
    }
    return parseFloat(cleaned) || 0;
  }

  // If only comma exists, assume comma is decimal separator
  if (cleaned.indexOf(',') !== -1) {
    return parseFloat(cleaned.replace(/,/g, '.')) || 0;
  }

  return parseFloat(cleaned) || 0;
};

export const calculateMRR = (
  ticketValue: number,
  duration: number,
  paymentFrequency: PaymentFrequency
): number => {
  const months = duration && duration > 0 ? duration : 1;
  return ticketValue / months;
};

export default { parseTicketValue, calculateMRR, durationMonths };
