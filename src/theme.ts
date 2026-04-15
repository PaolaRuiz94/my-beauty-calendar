import { ReactNode, createContext } from 'react';

export const theme = {
  colors: {
    background: '#FFF6F7',
    card: '#FFFFFF',
    surface: '#FFE9EA',
    primary: '#D98C96',
    secondary: '#E8A9B1',
    accent: '#F2C5CB',
    textPrimary: '#3D2834',
    textSecondary: '#84616D',
    border: '#F1D1D6',
    overlay: 'rgba(217, 140, 150, 0.16)',
    softWhite: '#FFF6F8',
    white: '#FFFFFF',
    black: '#31232F',
  },
};

type ThemeType = typeof theme;

export const ThemeContext = createContext<ThemeType>(theme);

export type { ThemeType };
