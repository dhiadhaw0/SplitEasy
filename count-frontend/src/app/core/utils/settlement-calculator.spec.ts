import { computeSettlements } from './settlement-calculator';

describe('computeSettlements', () => {
  it('A:+30 B:-20 C:-10 settles in 2 transfers, largest debtor first', () => {
    const settlements = computeSettlements([
      { id: 1, name: 'A', balance: 30 },
      { id: 2, name: 'B', balance: -20 },
      { id: 3, name: 'C', balance: -10 }
    ]);

    expect(settlements.length).toBe(2);
    expect(settlements[0]).toEqual({ fromId: 2, fromName: 'B', toId: 1, toName: 'A', amount: 20 });
    expect(settlements[1]).toEqual({ fromId: 3, fromName: 'C', toId: 1, toName: 'A', amount: 10 });
  });

  it('returns an empty list when every balance is zero', () => {
    const settlements = computeSettlements([
      { id: 1, name: 'A', balance: 0 },
      { id: 2, name: 'B', balance: 0 }
    ]);

    expect(settlements).toEqual([]);
  });

  it('never produces more than n - 1 transfers and conserves the total amount owed', () => {
    const balances = [
      { id: 1, name: 'A', balance: 15 },
      { id: 2, name: 'B', balance: 45 },
      { id: 3, name: 'C', balance: -20 },
      { id: 4, name: 'D', balance: -40 }
    ];

    const settlements = computeSettlements(balances);

    expect(settlements.length).toBeLessThanOrEqual(balances.length - 1);
    const total = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBeCloseTo(60, 2);
  });
});
