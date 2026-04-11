import { ReactNode, createContext } from 'react';

export const theme = {
  colors: {
    background: '#FFF5F7',
    card: '#FDE9EE',
    surface: '#F8E1E9',
    primary: '#8B4564',
    secondary: '#C28CA8',
    accent: '#E6B2C6',
    textPrimary: '#3D2834',
    textSecondary: '#7E5F6F',
    border: '#E7C6D1',
    overlay: 'rgba(255, 239, 244, 0.26)',
    softWhite: '#FFF6F8',
    white: '#FFFFFF',
    black: '#31232F',
  },
};

type ThemeType = typeof theme;

export const ThemeContext = createContext<ThemeType>(theme);

export type { ThemeType };
