import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, Sun, Moon, Shield, Radio, ChevronDown } from 'lucide-react';
import { useTheme, THEME_OPTIONS, ThemeId } from '../utils/themeContext';

export const ThemeSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentTheme, setTheme, themeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="theme-selector-toggle-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border theme-border theme-bg-card hover:border-[var(--theme-accent)] transition-all text-xs font-mono theme-text-main shadow-sm cursor-pointer"
        aria-label="Change design theme"
        title="Switch design theme"
      >
        <span
          className="w-3 h-3 rounded-full border border-white/20 shadow-inner flex items-center justify-center shrink-0"
          style={{ backgroundColor: themeConfig.accentHex }}
        />
        {!compact && (
          <span className="font-semibold tracking-wide">
            {themeConfig.name}
          </span>
        )}
        <Palette className="w-3.5 h-3.5 opacity-70" />
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="theme-selector-dropdown"
          className="absolute right-0 mt-2 w-72 rounded-xl border theme-border theme-bg-card shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl"
        >
          <div className="px-2.5 py-2 border-b theme-border-subtle flex items-center justify-between mb-1">
            <span className="text-[11px] font-military font-bold uppercase tracking-wider theme-text-muted flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Design Themes
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded theme-badge-accent font-bold">
              {THEME_OPTIONS.length} Themes
            </span>
          </div>

          <div className="space-y-1">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  id={`theme-option-${theme.id}`}
                  type="button"
                  onClick={() => {
                    setTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start justify-between gap-3 border ${
                    isSelected
                      ? 'theme-bg-subtle border-[var(--theme-accent)] shadow-sm'
                      : 'border-transparent hover:theme-bg-subtle/80 hover:border-[var(--theme-border-subtle)]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0 mt-0.5 shadow-sm flex items-center justify-center text-[8px] font-bold"
                      style={{ backgroundColor: theme.accentHex, color: theme.isDark ? '#000' : '#fff' }}
                    >
                      {theme.isDark ? '●' : '○'}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-military font-bold text-xs theme-text-main tracking-wide">
                          {theme.name}
                        </span>
                        <span className="text-[9px] font-mono px-1 rounded bg-[var(--theme-accent-bg)] text-[var(--theme-accent-text)] font-semibold border border-[var(--theme-accent-border)]">
                          {theme.badge}
                        </span>
                      </div>
                      <p className="text-[10px] theme-text-muted leading-tight truncate">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[var(--theme-accent)] shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
