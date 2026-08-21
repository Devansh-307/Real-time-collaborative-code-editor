import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, FileCode, Sparkles } from 'lucide-react';

export default function LanguageSelector({
  languages = [],
  selectedLanguage = 'python',
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = languages.find((l) => l.id === selectedLanguage) || {
    id: selectedLanguage,
    label: selectedLanguage.toUpperCase(),
    version: '',
  };

  const getLangColor = (id) => {
    switch (id) {
      case 'python':
        return 'text-blue-400';
      case 'javascript':
        return 'text-yellow-400';
      case 'cpp':
        return 'text-sky-400';
      case 'java':
        return 'text-orange-400';
      case 'json':
        return 'text-emerald-400';
      case 'html':
        return 'text-rose-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 transition-colors shadow-sm"
      >
        <span className={`font-semibold ${getLangColor(activeLang.id)}`}>
          {activeLang.label}
        </span>
        {activeLang.version && (
          <span className="text-[10px] text-slate-400 bg-[#161b22] px-1.5 py-0.2 rounded border border-[#30363d]">
            {activeLang.version}
          </span>
        )}
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 rounded-lg bg-[#161b22] border border-[#30363d] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-[#30363d] text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Execution Runtime & Templates
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {languages.map((lang) => {
              const isSelected = lang.id === selectedLanguage;
              return (
                <button
                  key={lang.id}
                  onClick={() => {
                    onSelect(lang.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'text-slate-300 hover:bg-[#21262d]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileCode size={14} className={getLangColor(lang.id)} />
                    <div className="flex flex-col text-left">
                      <span>{lang.label}</span>
                      <span className="text-[10px] text-slate-400">{lang.version}</span>
                    </div>
                  </div>

                  {isSelected && <Check size={14} className="text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
