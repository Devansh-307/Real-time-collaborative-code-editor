import React from 'react';
import { DEFAULT_LANGUAGES } from '../utils/constants';
import { LanguageOption } from '../types';
import { Code2 } from 'lucide-react';

interface LanguageSelectProps {
  currentLanguage: LanguageOption;
  onSelectLanguage: (language: LanguageOption) => void;
  disabled?: boolean;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({
  currentLanguage,
  onSelectLanguage,
  disabled,
}) => {
  return (
    <div className="relative inline-flex items-center">
      <Code2 className="w-4 h-4 text-sky-400 absolute left-3 pointer-events-none" />
      <select
        value={currentLanguage.id}
        onChange={(e) => {
          const selected = DEFAULT_LANGUAGES.find((lang) => lang.id === e.target.value);
          if (selected) {
            onSelectLanguage(selected);
          }
        }}
        disabled={disabled}
        className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-medium pl-9 pr-8 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
      >
        {DEFAULT_LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id} className="bg-slate-900 text-slate-200">
            {lang.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
        ▼
      </div>
    </div>
  );
};
