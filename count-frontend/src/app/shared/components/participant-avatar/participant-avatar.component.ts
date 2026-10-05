import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Fun gradient pairs so the same name always maps to the same colorful avatar.
const GRADIENTS: [string, string][] = [
  ['#00897b', '#4fd1c5'],
  ['#3949ab', '#7c8cf8'],
  ['#8e24aa', '#e879f9'],
  ['#d81b60', '#ff8fab'],
  ['#f4511e', '#ffb26b'],
  ['#00838f', '#4dd0e1'],
  ['#7cb342', '#c6e377'],
  ['#5e35b1', '#b39ddb'],
  ['#ef6c00', '#ffca7a'],
  ['#c2185b', '#f48fb1']
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

  protected readonly gradient = computed(() => {
    let hash = 0;
    for (const char of this.name()) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }
    const [from, to] = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  });
}
