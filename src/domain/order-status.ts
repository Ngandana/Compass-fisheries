import type { OrderStatus } from './types';

/**
 * The order lifecycle, as an explicit state machine.
 *
 * Previously this logic was two partial lookup maps inside the dashboard
 * component, which meant nothing outside that component could reason about
 * what a legal transition was — including the database.
 */

/** Statuses from which no further transition is possible. */
export const TERMINAL_STATUSES = ['Collected', 'Cancelled'] as const satisfies readonly OrderStatus[];

/** The happy path, in order. Used to render the customer's progress tracker. */
export const PROGRESS_STEPS = [
  'Order Received',
  'Being Prepared',
  'Ready for Collection',
  'Collected',
] as const satisfies readonly OrderStatus[];

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  'Order Received': ['Being Prepared', 'Cancelled'],
  'Being Prepared': ['Ready for Collection', 'Cancelled'],
  'Ready for Collection': ['Collected', 'Cancelled'],
  Collected: [],
  Cancelled: [],
};

/** The label a staff member sees on the button that advances this order. */
const ADVANCE_LABELS: Partial<Record<OrderStatus, string>> = {
  'Order Received': 'Accept & Prepare',
  'Being Prepared': 'Mark Ready',
  'Ready for Collection': 'Mark Collected',
};

export function isTerminal(status: OrderStatus): boolean {
  return (TERMINAL_STATUSES as readonly OrderStatus[]).includes(status);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** The next status on the happy path, or null if there isn't one. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = (PROGRESS_STEPS as readonly OrderStatus[]).indexOf(status);
  if (index === -1 || index === PROGRESS_STEPS.length - 1) return null;
  return PROGRESS_STEPS[index + 1] ?? null;
}

export function advanceLabel(status: OrderStatus): string | null {
  return ADVANCE_LABELS[status] ?? null;
}

export function canCancel(status: OrderStatus): boolean {
  return canTransition(status, 'Cancelled');
}

/**
 * How far along the progress tracker this order is.
 * Returns -1 for cancelled orders, which are shown as a separate state.
 */
export function progressIndex(status: OrderStatus): number {
  return (PROGRESS_STEPS as readonly OrderStatus[]).indexOf(status);
}
