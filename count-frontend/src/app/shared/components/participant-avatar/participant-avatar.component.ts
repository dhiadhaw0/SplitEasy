import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// A small, fixed palette so the same name always maps to the same color.
const PALETTE = ['#00897b', '#3949ab', '#8e24aa', '#d81b60', '#f4511e', '#6d4c41', '#00acc1', '#7cb342', '#5e35b1', '#546e7a'];

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

  protected readonly backgroundColor = computed(() => {
    let hash = 0;
    for (const char of this.name()) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
  });
}
