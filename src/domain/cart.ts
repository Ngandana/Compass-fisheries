import type { CartLine, Cents, MenuItem, Sauce } from './types';

/** Upper bound on a single line, so a stuck "+" button can't order 900 chips. */
export const MAX_LINE_QUANTITY = 20;
export const MAX_NOTES_LENGTH = 200;

export function lineSubtotal(line: Pick<CartLine, 'priceCents' | 'quantity'>): Cents {
  return line.priceCents * line.quantity;
}

export function cartTotal(lines: readonly CartLine[]): Cents {
  return lines.reduce((sum, line) => sum + lineSubtotal(line), 0);
}

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(quantity)));
}

/**
 * Builds a cart line from a menu item plus the customer's choices.
 * `lineId` is caller-supplied so this stays pure and testable — see `newLineId`.
 */
export function buildCartLine(
  item: MenuItem,
  choices: { quantity: number; sauce: Sauce; notes: string },
  lineId: string,
): CartLine {
  return {
    lineId,
    menuItemId: item.id,
    name: item.name,
    priceCents: item.priceCents,
    imageUrl: item.imageUrl,
    quantity: clampQuantity(choices.quantity),
    sauce: choices.sauce,
    notes: choices.notes.trim().slice(0, MAX_NOTES_LENGTH),
  };
}

export function newLineId(): string {
  return crypto.randomUUID();
}
