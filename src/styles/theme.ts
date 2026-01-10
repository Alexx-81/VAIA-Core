export const colors = {
  vaia: '#0B4F8A',
  core: '#FF7A00',
  
  dark: {
    background: '#1a1a1a',
    surface: '#2d2d2d',
    surfaceHover: '#3a3a3a',
    text: '#e0e0e0',
    textSecondary: '#a0a0a0',
    border: '#404040',
  },
  
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceHover: '#f0f0f0',
    text: '#2d2d2d',
    textSecondary: '#666666',
    border: '#e0e0e0',
  },
};

export type Theme = 'dark' | 'light';

export const getThemeColors = (theme: Theme) => {
  return theme === 'dark' ? colors.dark : colors.light;
};
