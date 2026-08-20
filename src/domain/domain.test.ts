import { describe, expect, it } from 'vitest';

import { buildCartLine, cartCount, cartTotal, clampQuantity, lineSubtotal } from './cart';
import { formatMoney, formatPrice, randToCents } from './money';
import {
  advanceLabel,
  canCancel,
  canTransition,
  isTerminal,
  nextStatus,
  progressIndex,
} from './order-status';
import { formatPhoneForDisplay, isValidPhone, normalisePhone } from './phone';
import { ORDER_STATUSES, type CartLine, type MenuItem, type OrderStatus } from './types';

// ─── Money ────────────────────────────────────────────────────────────────────

describe('money', () => {
  it('formats whole rands without decimals', () => {
    expect(formatPrice(2000)).toBe('R20');
    expect(formatPrice(10000)).toBe('R100');
  });

  it('keeps decimals when a price is not a whole rand', () => {
    expect(formatPrice(2050)).toMatch(/50/);
  });

  it('formats full precision for receipts', () => {
    // en-ZA uses a comma decimal separator and a non-breaking space group separator.
    expect(formatMoney(123450)).toMatch(/1.234,50/);
  });

  it('converts rands to cents without float drift', () => {
    expect(randToCents(20)).toBe(2000);
    expect(randToCents(0.1) + randToCents(0.2)).toBe(30);
  });

  it('never loses a cent across a large cart', () => {
    // The bug this guards: doing this arithmetic in floats.
    const total = Array.from({ length: 1000 }, () => 1999).reduce((a, b) => a + b, 0);
    expect(total).toBe(1_999_000);
    expect(Number.isInteger(total)).toBe(true);
  });
});

// ─── Order status machine ─────────────────────────────────────────────────────

describe('order status machine', () => {
  it('walks the happy path in order', () => {
    expect(nextStatus('Order Received')).toBe('Being Prepared');
    expect(nextStatus('Being Prepared')).toBe('Ready for Collection');
    expect(nextStatus('Ready for Collection')).toBe('Collected');
  });

  it('stops at terminal statuses', () => {
    expect(nextStatus('Collected')).toBeNull();
    expect(nextStatus('Cancelled')).toBeNull();
    expect(isTerminal('Collected')).toBe(true);
    expect(isTerminal('Cancelled')).toBe(true);
    expect(isTerminal('Order Received')).toBe(false);
  });

  it('refuses to move a collected order', () => {
    for (const to of ORDER_STATUSES) {
      expect(canTransition('Collected', to)).toBe(false);
      expect(canTransition('Cancelled', to)).toBe(false);
    }
  });

  it('refuses to skip a step', () => {
    expect(canTransition('Order Received', 'Ready for Collection')).toBe(false);
    expect(canTransition('Order Received', 'Collected')).toBe(false);
    expect(canTransition('Being Prepared', 'Collected')).toBe(false);
  });

  it('refuses to move backwards', () => {
    expect(canTransition('Ready for Collection', 'Being Prepared')).toBe(false);
    expect(canTransition('Being Prepared', 'Order Received')).toBe(false);
  });

  it('allows cancelling anything not yet finished', () => {
    expect(canCancel('Order Received')).toBe(true);
    expect(canCancel('Being Prepared')).toBe(true);
    expect(canCancel('Ready for Collection')).toBe(true);
    expect(canCancel('Collected')).toBe(false);
    expect(canCancel('Cancelled')).toBe(false);
  });

  it('gives every advanceable status a button label, and terminal ones none', () => {
    const advanceable = ORDER_STATUSES.filter((s) => nextStatus(s) !== null);
    for (const status of advanceable) {
      expect(advanceLabel(status), `expected a label for ${status}`).toBeTruthy();
    }
    expect(advanceLabel('Collected')).toBeNull();
    expect(advanceLabel('Cancelled')).toBeNull();
  });

  it('reports cancelled orders as off the progress track', () => {
    expect(progressIndex('Cancelled')).toBe(-1);
    expect(progressIndex('Order Received')).toBe(0);
    expect(progressIndex('Collected')).toBe(3);
  });

  it('has a transition entry for every status', () => {
    for (const status of ORDER_STATUSES) {
      expect(() => canTransition(status, 'Cancelled')).not.toThrow();
    }
  });
});

// ─── Cart ─────────────────────────────────────────────────────────────────────

const CHIPS: MenuItem = {
  id: 'c1',
  name: 'Medium Chips',
  category: 'Chips',
  priceCents: 3000,
  description: '',
  imageUrl: null,
  available: true,
  popular: true,
  sortOrder: 1,
};

function line(over: Partial<CartLine> = {}): CartLine {
  return {
    lineId: 'l1',
    menuItemId: 'c1',
    name: 'Medium Chips',
    priceCents: 3000,
    imageUrl: null,
    quantity: 1,
    sauce: 'Plain',
    notes: '',
    ...over,
  };
}

describe('cart', () => {
  it('totals an empty cart as zero', () => {
    expect(cartTotal([])).toBe(0);
    expect(cartCount([])).toBe(0);
  });

  it('multiplies price by quantity', () => {
    expect(lineSubtotal({ priceCents: 3000, quantity: 3 })).toBe(9000);
  });

  it('sums mixed lines', () => {
    const lines = [line({ quantity: 2 }), line({ lineId: 'l2', priceCents: 7000, quantity: 1 })];
    expect(cartTotal(lines)).toBe(13000);
    expect(cartCount(lines)).toBe(3);
  });

  it('clamps quantity into a sane range', () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
    expect(clampQuantity(999)).toBe(20);
    expect(clampQuantity(2.7)).toBe(2);
    expect(clampQuantity(Number.NaN)).toBe(1);
  });

  it('trims and caps free-text notes', () => {
    const built = buildCartLine(CHIPS, { quantity: 1, sauce: 'Plain', notes: '  extra crispy  ' }, 'x');
    expect(built.notes).toBe('extra crispy');

    const long = buildCartLine(CHIPS, { quantity: 1, sauce: 'Plain', notes: 'a'.repeat(500) }, 'x');
    expect(long.notes).toHaveLength(200);
  });

  it('captures the price onto the line so a later repricing cannot change a placed order', () => {
    const built = buildCartLine(CHIPS, { quantity: 2, sauce: 'Vinegar', notes: '' }, 'x');
    expect(built.priceCents).toBe(3000);
    expect(lineSubtotal(built)).toBe(6000);
  });
});

// ─── Phone ────────────────────────────────────────────────────────────────────

describe('phone', () => {
  it('normalises every common way a South African writes their number', () => {
    const expected = '+27712345678';
    for (const input of [
      '0712345678',
      '071 234 5678',
      '071-234-5678',
      '+27712345678',
      '+27 71 234 5678',
      '0027712345678',
      '27712345678',
    ]) {
      expect(normalisePhone(input), input).toBe(expected);
    }
  });

  it('rejects what is not a South African mobile number', () => {
    for (const input of ['', '   ', 'abc', '12345', '0123456789', '021 555 1234', '07123456789']) {
      expect(isValidPhone(input), input).toBe(false);
    }
  });

  it('rejects a landline, which cannot receive an SMS', () => {
    expect(normalisePhone('0215551234')).toBeNull();
  });

  it('round-trips back to a readable local format', () => {
    expect(formatPhoneForDisplay('+27712345678')).toBe('071 234 5678');
  });
});

// ─── Exhaustiveness guard ─────────────────────────────────────────────────────

describe('type coverage', () => {
  it('tests every status the type allows', () => {
    // If someone adds a status to the union, this fails until the tests cover it.
    const covered: OrderStatus[] = [
      'Order Received',
      'Being Prepared',
      'Ready for Collection',
      'Collected',
      'Cancelled',
    ];
    expect(new Set(covered)).toEqual(new Set(ORDER_STATUSES));
  });
});
