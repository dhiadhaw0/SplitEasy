export interface BalanceEntry {
  id: number;
  name: string;
  balance: number;
}

export interface SettlementEntry {
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  amount: number;
}

const EPSILON = 0.01;

/**
 * Mirrors the backend's greedy debt-simplification algorithm (SettlementServiceImpl.java):
 * repeatedly matches the largest creditor with the largest debtor. Produces at most (n - 1)
 * transfers for n participants. Used by the public landing page's interactive demo, so it
 * never touches the network — same math as the real app, computed client-side.
 */
export function computeSettlements(balances: BalanceEntry[]): SettlementEntry[] {
  const creditors = balances
    .filter(b => b.balance > 0)
    .map(b => ({ id: b.id, name: b.name, remaining: b.balance }));
  const debtors = balances
    .filter(b => b.balance < 0)
    .map(b => ({ id: b.id, name: b.name, remaining: Math.abs(b.balance) }));

  const settlements: SettlementEntry[] = [];
  const maxIterations = balances.length;

  for (let i = 0; i < maxIterations; i++) {
    const activeCreditors = creditors.filter(c => c.remaining >= EPSILON);
    const activeDebtors = debtors.filter(d => d.remaining >= EPSILON);
    if (activeCreditors.length === 0 || activeDebtors.length === 0) {
      break;
    }

    activeCreditors.sort((a, b) => b.remaining - a.remaining);
    activeDebtors.sort((a, b) => b.remaining - a.remaining);

    const topCreditor = activeCreditors[0];
    const topDebtor = activeDebtors[0];
    const amount = roundToCents(Math.min(topCreditor.remaining, topDebtor.remaining));

    settlements.push({
      fromId: topDebtor.id,
      fromName: topDebtor.name,
      toId: topCreditor.id,
      toName: topCreditor.name,
      amount
    });

    topCreditor.remaining = roundToCents(topCreditor.remaining - amount);
    topDebtor.remaining = roundToCents(topDebtor.remaining - amount);
  }

  return settlements;
}

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
