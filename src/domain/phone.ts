/**
 * South African mobile number handling.
 *
 * The checkout previously accepted any non-empty string as a phone number,
 * which for a shop that intends to phone or message customers means orders
 * that cannot be chased. Collection is the whole product; the number matters.
 */

/** Strips spaces, dashes, brackets. */
function stripFormatting(input: string): string {
  return input.replace(/[\s\-()]/g, '');
}

/**
 * Normalises to E.164 (+27…) so the stored value is unambiguous and ready for
 * any messaging provider. Returns null if it isn't a valid SA mobile number.
 *
 * Accepts: 0712345678, 071 234 5678, +27712345678, 0027712345678, 27712345678
 */
export function normalisePhone(input: string): string | null {
  const raw = stripFormatting(input.trim());
  if (raw === '') return null;

  let national: string;

  if (raw.startsWith('+27')) national = raw.slice(3);
  else if (raw.startsWith('0027')) national = raw.slice(4);
  else if (raw.startsWith('27') && raw.length === 11) national = raw.slice(2);
  else if (raw.startsWith('0')) national = raw.slice(1);
  else return null;

  // SA mobile prefixes are 6, 7 or 8 followed by 8 digits total.
  if (!/^[678]\d{8}$/.test(national)) return null;

  return `+27${national}`;
}

export function isValidPhone(input: string): boolean {
  return normalisePhone(input) !== null;
}

/** "071 234 5678" — how a South African reads their own number back. */
export function formatPhoneForDisplay(e164: string): string {
  const match = /^\+27(\d{2})(\d{3})(\d{4})$/.exec(e164);
  if (!match) return e164;
  return `0${match[1]} ${match[2]} ${match[3]}`;
}
