import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Flat colors so the same name always maps to the same avatar — enough variety to tell people
// apart at a glance, all drawn from one cohesive, muted palette (no neon, no gradients).
const COLORS = [
  '#2563eb', // blue
  '#0d9488', // teal
  '#4f46e5', // indigo
  '#0891b2', // cyan
  '#7c3aed', // violet
  '#be185d', // rose
  '#b45309', // amber
  '#059669' // emerald
];

@Component({
  selector: 'app-participant-avatar',
  standalone: true,
  templateUrl: './participant-avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantAvatarComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(36);

  protected readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return '?';
    }
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  });

  protected readonly color = computed(() => {
    let hash = 0;
    for (const char of this.name()) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
  });
}
