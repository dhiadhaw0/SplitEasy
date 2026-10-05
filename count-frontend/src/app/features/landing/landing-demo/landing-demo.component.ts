import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { computeShares } from '../../../core/utils/split-calculator';
import { computeSettlements } from '../../../core/utils/settlement-calculator';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { ParticipantAvatarComponent } from '../../../shared/components/participant-avatar/participant-avatar.component';

interface DemoParticipant {
  id: number;
  name: string;
  paid: number;
}

const DEMO_PREFILL_KEY = 'spliteasy_demo_prefill';
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 8;

@Component({
  selector: 'app-landing-demo',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    TranslocoPipe,
    MoneyDisplayComponent,
    ParticipantAvatarComponent
  ],
  templateUrl: './landing-demo.component.html',
  styleUrl: './landing-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingDemoComponent {
  private readonly router = inject(Router);

  private nextId = 4;

  protected readonly participants = signal<DemoParticipant[]>([
    { id: 1, name: 'Sara', paid: 120 },
    { id: 2, name: 'Ali', paid: 60 },
    { id: 3, name: 'Omar', paid: 40 }
  ]);

  protected readonly canAddParticipant = computed(() => this.participants().length < MAX_PARTICIPANTS);
  protected readonly canRemoveParticipant = computed(() => this.participants().length > MIN_PARTICIPANTS);

  protected readonly total = computed(() => roundToCents(this.participants().reduce((sum, p) => sum + (p.paid || 0), 0)));

  protected readonly shareAmount = computed(() => {
    const people = this.participants();
    if (people.length === 0 || this.total() <= 0) {
      return 0;
    }
    const shares = computeShares(
      this.total(),
      'EQUAL',
      people.map(p => ({ participantId: p.id, value: null }))
    );
    return shares[0]?.amount ?? 0;
  });

  protected readonly balances = computed(() => {
    const people = this.participants();
    if (this.total() <= 0) {
      return people.map(p => ({ id: p.id, name: p.name || '—', balance: 0 }));
    }
    const shares = computeShares(
      this.total(),
      'EQUAL',
      people.map(p => ({ participantId: p.id, value: null }))
    );
    return people.map(p => {
      const consumed = shares.find(s => s.participantId === p.id)?.amount ?? 0;
      return { id: p.id, name: p.name || '—', balance: roundToCents(p.paid - consumed) };
    });
  });

  protected readonly maxAbsBalance = computed(() => Math.max(1, ...this.balances().map(b => Math.abs(b.balance))));

  protected readonly settlements = computed(() => computeSettlements(this.balances()));

  protected leftWidthPercent(balance: number): number {
    return balance < 0 ? (Math.abs(balance) / this.maxAbsBalance()) * 100 : 0;
  }

  protected rightWidthPercent(balance: number): number {
    return balance > 0 ? (Math.abs(balance) / this.maxAbsBalance()) * 100 : 0;
  }

  protected updateName(id: number, name: string): void {
    this.participants.update(people => people.map(p => (p.id === id ? { ...p, name } : p)));
  }

  protected updatePaid(id: number, value: string): void {
    const paid = Math.max(0, Number(value) || 0);
    this.participants.update(people => people.map(p => (p.id === id ? { ...p, paid } : p)));
  }

  protected addParticipant(): void {
    if (!this.canAddParticipant()) {
      return;
    }
    this.participants.update(people => [...people, { id: this.nextId++, name: '', paid: 0 }]);
  }

  protected removeParticipant(id: number): void {
    if (!this.canRemoveParticipant()) {
      return;
    }
    this.participants.update(people => people.filter(p => p.id !== id));
  }

  /**
   * Stores the demo's numbers so the sign-up flow can offer to pre-fill a real group with
   * them. NOTE: only the write side is wired up here; consuming this after registration to
   * auto-create the group is a natural follow-up, not yet implemented.
   */
  protected createRealGroup(): void {
    try {
      sessionStorage.setItem(
        DEMO_PREFILL_KEY,
        JSON.stringify({ participants: this.participants(), currency: 'EUR' })
      );
    } catch {
      // Ignore: worst case the sign-up flow just starts without a pre-fill.
    }
    this.router.navigate(['/register']);
  }
}

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
