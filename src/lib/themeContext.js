import { createContext } from 'react';

/** { theme: 'light' | 'dark', setTheme(theme), toggle() } */
export const ThemeContext = createContext(null);

export const THEME_STORAGE_KEY = 'na-theme';
