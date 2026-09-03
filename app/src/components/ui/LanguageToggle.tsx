'use client';

import { Language } from '@/lib/i18n';

interface LanguageToggleProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
}

export function LanguageToggle({ currentLang, onLanguageChange, className = '' }: LanguageToggleProps) {
  return (
    <div className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-apu-wash border border-apu-borde ${className}`}>
      <button
        onClick={() => onLanguageChange('es')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          currentLang === 'es'
            ? 'bg-white text-brand-violet shadow-sm'
            : 'text-apu-tenue hover:text-apu-ink'
        }`}
        aria-label="Español"
      >
        ES
      </button>
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          currentLang === 'en'
            ? 'bg-white text-brand-violet shadow-sm'
            : 'text-apu-tenue hover:text-apu-ink'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
