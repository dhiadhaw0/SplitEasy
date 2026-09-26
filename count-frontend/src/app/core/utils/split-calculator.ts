import { SplitType } from '../models/enums';

export interface ShareInput {
  participantId: number;
  /** Raw value entered by the user: weight, percentage or exact amount. Ignored for EQUAL. */
  value: number | null;
}

export interface ComputedShare {
  participantId: number;
  /** Computed amount, in the same currency unit as the input amount (e.g. euros), 2 decimals. */
  amount: number;
}

/**
 * Mirrors the backend's rounding rule (SplitCalculator.java) so the live preview shown while
 * editing an expense matches exactly what the server will compute and persist:
 * each share is rounded DOWN to 2 decimals, then the leftover cents are handed out one by one
 * to the participants with the smallest id.
 *
 * Everything is computed in integer cents to avoid floating-point drift, then converted back.
 * This function is deliberately lenient with invalid/partial input (missing values, weights
 * that don't sum correctly, etc.): it never throws, so it can be called on every keystroke
 * while the form is still being filled in. Strict validation (matching the backend's rules)
 * is the job of `computeRemaining` below.
 */
export function computeShares(amount: number, splitType: SplitType, shares: ShareInput[]): ComputedShare[] {
  const amountCents = toCents(amount);
  const ids = shares.map(s => s.participantId).slice().sort((a, b) => a - b);
  const valuesById = new Map(shares.map(s => [s.participantId, s.value]));

  let amountsCents: Map<number, number>;
  switch (splitType) {
    case 'EQUAL':
      amountsCents = computeEqual(amountCents, ids);
      break;
    case 'AMOUNTS':
      amountsCents = computeAmounts(ids, valuesById);
      break;
    case 'SHARES':
      amountsCents = computeWeighted(amountCents, ids, valuesById);
      break;
    case 'PERCENTAGES':
      amountsCents = computePercentages(amountCents, ids, valuesById);
      break;
  }

  return ids.map(id => ({ participantId: id, amount: fromCents(amountsCents.get(id) ?? 0) }));
}

/** amount actually assigned to `value` fields, minus the target (used for the "reste à répartir" hints). */
export function computeRemainingAmount(amount: number, shares: ShareInput[]): number {
  const sum = shares.reduce((total, s) => total + toCents(s.value ?? 0), 0);
  return fromCents(toCents(amount) - sum);
}

export function computeRemainingPercentage(shares: ShareInput[]): number {
  const sum = shares.reduce((total, s) => total + (s.value ?? 0), 0);
  return Math.round((100 - sum) * 100) / 100;
}

function computeEqual(amountCents: number, ids: number[]): Map<number, number> {
  if (ids.length === 0) {
    return new Map();
  }
  const base = Math.floor(amountCents / ids.length);
  const amounts = new Map(ids.map(id => [id, base]));
  return distributeRemainder(amountCents, ids, amounts);
}

function computeAmounts(ids: number[], valuesById: Map<number, number | null>): Map<number, number> {
  return new Map(ids.map(id => [id, toCents(valuesById.get(id) ?? 0)]));
}

function computeWeighted(amountCents: number, ids: number[], valuesById: Map<number, number | null>): Map<number, number> {
  const totalWeight = ids.reduce((sum, id) => sum + Math.max(0, valuesById.get(id) ?? 0), 0);
  if (totalWeight <= 0) {
    return new Map(ids.map(id => [id, 0]));
  }
  const amounts = new Map<number, number>();
  for (const id of ids) {
    const weight = Math.max(0, valuesById.get(id) ?? 0);
    amounts.set(id, Math.floor((amountCents * weight) / totalWeight));
  }
  return distributeRemainder(amountCents, ids, amounts);
}

function computePercentages(amountCents: number, ids: number[], valuesById: Map<number, number | null>): Map<number, number> {
  const amounts = new Map<number, number>();
  for (const id of ids) {
    const percentage = Math.max(0, valuesById.get(id) ?? 0);
    amounts.set(id, Math.floor((amountCents * percentage) / 100));
  }
  return distributeRemainder(amountCents, ids, amounts);
}

/**
 * Hands out the leftover cents to the participants with the smallest id, in order.
 * If the input is not yet valid (remainder outside [0, n)), the bases are returned unmodified:
 * this is a live preview, not a submission gate.
 */
function distributeRemainder(amountCents: number, sortedIds: number[], baseAmounts: Map<number, number>): Map<number, number> {
  const distributed = sortedIds.reduce((sum, id) => sum + (baseAmounts.get(id) ?? 0), 0);
  const remainder = amountCents - distributed;

  if (remainder < 0 || remainder >= sortedIds.length) {
    return baseAmounts;
  }

  const result = new Map(baseAmounts);
  for (let i = 0; i < remainder; i++) {
    const id = sortedIds[i];
    result.set(id, (result.get(id) ?? 0) + 1);
  }
  return result;
}

function toCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}

function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}
