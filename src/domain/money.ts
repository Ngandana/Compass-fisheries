import type { Cents } from './types';

/**
 * All money is integer cents. These helpers are the only place that converts
 * between cents and anything a person reads.
 */

const ZAR = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
});

/** "R1 234,50" — full precision, for totals and receipts. */
export function formatMoney(cents: Cents): string {
  return ZAR.format(cents / 100);
}

/**
 * "R20" — drops the decimals when a price is a whole rand, which every item on
 * this menu currently is. Falls back to full precision when it isn't.
 */
export function formatPrice(cents: Cents): string {
  if (cents % 100 === 0) return `R${cents / 100}`;
  return formatMoney(cents);
}

export function randToCents(rand: number): Cents {
  return Math.round(rand * 100);
}
