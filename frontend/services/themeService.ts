export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'cognipath_theme_preference';

export const themeService = {
  /**
   * Retrieves active theme preference or defaults to OS color scheme
   */
  getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      // Respect operating system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  },

  /**
   * Applies theme mode to documentElement classList and saves to localStorage
   */
  applyTheme(theme: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme in localStorage:', e);
    }
  }
};
