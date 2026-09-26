import { Injectable, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

const STORAGE_KEY = 'spliteasy_lang';
const RTL_LANGS = ['ar'];

export interface LanguageOption {
  code: string;
  label: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' }
];

/**
 * Thin wrapper around TranslocoService: persists the chosen language and keeps the
 * document's `lang`/`dir` attributes (RTL for Arabic) in sync with it.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translocoService = inject(TranslocoService);

  readonly currentLang = toSignal(this.translocoService.langChanges$, {
    initialValue: this.translocoService.getActiveLang()
  });

  constructor() {
    const saved = this.restore();
    if (saved) {
      this.translocoService.setActiveLang(saved);
    }

    effect(() => {
      this.applyDocumentAttributes(this.currentLang());
    });
  }

  setLanguage(code: string): void {
    this.translocoService.setActiveLang(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Ignore: the choice just won't survive a reload in this environment.
    }
  }

  isRtl(lang: string = this.currentLang()): boolean {
    return RTL_LANGS.includes(lang);
  }

  private restore(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private applyDocumentAttributes(lang: string): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.lang = lang;
    document.documentElement.dir = this.isRtl(lang) ? 'rtl' : 'ltr';
  }
}
