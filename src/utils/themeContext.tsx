import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'aerospace' | 'executive-light' | 'cyber-stealth' | 'tactical';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  category: string;
  description: string;
  badge: string;
  accentHex: string;
  bgHex: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'aerospace',
    name: 'Aerospace Command',
    category: 'USAF Standard',
    description: 'Deep navy, aerospace cobalt, titanium slate & precision cyan',
    badge: 'NEW DEFAULT',
    accentHex: '#38bdf8',
    bgHex: '#070d18',
    isDark: true,
  },
  {
    id: 'executive-light',
    name: 'Pentagon Executive',
    category: 'Boardroom Light',
    description: 'Pristine paper-white, deep navy typography & sapphire accents',
    badge: 'LIGHT MODE',
    accentHex: '#1d4ed8',
    bgHex: '#f8fafc',
    isDark: false,
  },
  {
    id: 'cyber-stealth',
    name: 'Cyber & Space Ops',
    category: 'Special Operations',
    description: 'Obsidian carbon, emerald heads-up telemetry & matrix slate',
    badge: 'CYBER',
    accentHex: '#10b981',
    bgHex: '#080c0e',
    isDark: true,
  },
  {
    id: 'tactical',
    name: 'Heritage OCP',
    category: 'Air Force Heritage',
    description: 'Tactical flight suit charcoal, amber ordnance & rugged gold',
    badge: 'HERITAGE',
    accentHex: '#f59e0b',
    bgHex: '#09090b',
    isDark: true,
  },
];

interface ThemeContextType {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themeConfig: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'epb_architect_theme_v2';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
        return saved as ThemeId;
      }
    } catch {
      // fallback
    }
    return 'aerospace'; // Default to the brand-new Aerospace Command theme
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currentTheme);
    } catch (e) {
      console.warn('Could not persist theme to localStorage', e);
    }

    const htmlEl = document.documentElement;
    htmlEl.setAttribute('data-theme', currentTheme);
    
    // Manage html dark/light class
    const selected = THEME_OPTIONS.find((t) => t.id === currentTheme);
    if (selected && !selected.isDark) {
      htmlEl.classList.remove('dark');
      htmlEl.classList.add('light');
    } else {
      htmlEl.classList.add('dark');
      htmlEl.classList.remove('light');
    }
  }, [currentTheme]);

  const themeConfig = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: setCurrentTheme, themeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
