import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'spliteasy_theme';

/**
 * Real, app-wide dark mode: applies `data-theme` on <html> (read by both the Material dark
 * theme overrides and Tailwind's `dark:` variant in styles.scss / tailwind.config.js) and
 * persists the choice. Defaults to the OS preference on first visit.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(restoreInitialTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      applyToDocument(theme);
      persist(theme);
    });
  }

  toggle(): void {
    this.theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }
}

function restoreInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.): fall through to OS preference.
  }
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function applyToDocument(theme: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

function persist(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore: theme just won't survive a reload in this environment.
  }
}
