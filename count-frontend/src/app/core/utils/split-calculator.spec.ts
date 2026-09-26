import { computeRemainingAmount, computeRemainingPercentage, computeShares } from './split-calculator';

describe('computeShares', () => {
  it('splits 100 / 3 EQUAL giving the extra cent to the lowest id', () => {
    const result = computeShares(100, 'EQUAL', [
      { participantId: 1, value: null },
      { participantId: 2, value: null },
      { participantId: 3, value: null }
    ]);

    expect(find(result, 1)).toBe(33.34);
    expect(find(result, 2)).toBe(33.33);
    expect(find(result, 3)).toBe(33.33);
    expect(sum(result)).toBeCloseTo(100, 2);
  });

  it('splits SHARES 2/1/1 proportionally', () => {
    const result = computeShares(40, 'SHARES', [
      { participantId: 1, value: 2 },
      { participantId: 2, value: 1 },
      { participantId: 3, value: 1 }
    ]);

    expect(find(result, 1)).toBe(20);
    expect(find(result, 2)).toBe(10);
    expect(find(result, 3)).toBe(10);
  });

  it('distributes SHARES remainder cents to the lowest id', () => {
    const result = computeShares(10, 'SHARES', [
      { participantId: 1, value: 1 },
      { participantId: 2, value: 2 }
    ]);

    expect(find(result, 1)).toBe(3.34);
    expect(find(result, 2)).toBe(6.66);
  });

  it('uses exact values for AMOUNTS', () => {
    const result = computeShares(100, 'AMOUNTS', [
      { participantId: 1, value: 30 },
      { participantId: 2, value: 70 }
    ]);

    expect(find(result, 1)).toBe(30);
    expect(find(result, 2)).toBe(70);
  });

  it('splits PERCENTAGES proportionally to the amount', () => {
    const result = computeShares(100, 'PERCENTAGES', [
      { participantId: 1, value: 33.33 },
      { participantId: 2, value: 33.33 },
      { participantId: 3, value: 33.34 }
    ]);

    expect(sum(result)).toBeCloseTo(100, 2);
  });

  it('treats a zero total weight for SHARES as all-zero (no division by zero)', () => {
    const result = computeShares(50, 'SHARES', [
      { participantId: 1, value: 0 },
      { participantId: 2, value: 0 }
    ]);

    expect(find(result, 1)).toBe(0);
    expect(find(result, 2)).toBe(0);
  });
});

describe('computeRemainingAmount', () => {
  it('returns the gap between the target amount and the sum of entered values', () => {
    const remaining = computeRemainingAmount(100, [
      { participantId: 1, value: 30 },
      { participantId: 2, value: 50 }
    ]);
    expect(remaining).toBe(20);
  });

  it('returns 0 when the values already sum to the target', () => {
    const remaining = computeRemainingAmount(100, [
      { participantId: 1, value: 40 },
      { participantId: 2, value: 60 }
    ]);
    expect(remaining).toBe(0);
  });
});

describe('computeRemainingPercentage', () => {
  it('returns the gap to 100', () => {
    expect(computeRemainingPercentage([{ participantId: 1, value: 40 }, { participantId: 2, value: 50 }])).toBe(10);
  });

  it('returns 0 when percentages already sum to 100', () => {
    expect(computeRemainingPercentage([{ participantId: 1, value: 60 }, { participantId: 2, value: 40 }])).toBe(0);
  });
});

function find(shares: { participantId: number; amount: number }[], participantId: number): number {
  return shares.find(s => s.participantId === participantId)!.amount;
}

function sum(shares: { amount: number }[]): number {
  return shares.reduce((total, s) => total + s.amount, 0);
}
