// Theme System - Complete implementation
const THEME_KEY = 'github-explorer-theme';
const THEMES = { LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' };

const getSystemPrefersDark = () => 
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const updateThemeMeta = (isDark) => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#0f172a' : '#0ea5e9');
};

const updateThemeButton = (theme) => {
  const button = document.getElementById('theme-toggle');
  if (!button) return;
  
  const isDark = resolveTheme(theme);
  const iconSpan = button.querySelector('span.i') || button.querySelector('span:first-child');
  const textSpan = button.querySelector('span.hidden') || button.querySelector('span:last-child');
  
  if (iconSpan) {
    iconSpan.textContent = isDark ? '☀️' : '🌙';
  }
  if (textSpan) {
    textSpan.textContent = isDark ? 'Claro' : 'Escuro';
  }
  
  button.setAttribute('aria-pressed', String(isDark));
  button.setAttribute('aria-label', `Alternar para tema ${isDark ? 'claro' : 'escuro'}`);
  button.title = `Mudar para tema ${isDark ? 'claro' : 'escuro'}`;
};

const resolveTheme = (theme) => {
  if (theme === THEMES.DARK) return true;
  if (theme === THEMES.LIGHT) return false;
  return getSystemPrefersDark(); // system fallback
};

const applyThemeClasses = (isDark) => {
  const root = document.documentElement;
  const body = document.body;
  
  if (isDark) {
    root.classList.add('dark');
    body?.classList.add('dark');
  } else {
    root.classList.remove('dark');
    body?.classList.remove('dark');
  }
};

// Public API
export const getTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  return Object.values(THEMES).includes(stored) ? stored : THEMES.SYSTEM;
};

export const setTheme = (theme) => {
  if (!Object.values(THEMES).includes(theme)) {
    console.warn(`Invalid theme: ${theme}. Using system.`);
    theme = THEMES.SYSTEM;
  }
  
  const isDark = resolveTheme(theme);
  
  // Apply theme
  applyThemeClasses(isDark);
  updateThemeMeta(isDark);
  updateThemeButton(theme);
  
  // Persist preference
  localStorage.setItem(THEME_KEY, theme);
  
  console.log(`🎨 Theme set to: ${theme} (resolved: ${isDark ? 'dark' : 'light'})`);
};

export const toggleTheme = () => {
  const current = getTheme();
  let next;
  
  if (current === THEMES.LIGHT) {
    next = THEMES.DARK;
  } else if (current === THEMES.DARK) {
    next = THEMES.LIGHT;
  } else {
    // system -> explicit choice
    next = getSystemPrefersDark() ? THEMES.LIGHT : THEMES.DARK;
  }
  
  setTheme(next);
};

export const clearThemePreference = () => {
  localStorage.removeItem(THEME_KEY);
  setTheme(THEMES.SYSTEM);
};

export const initTheme = () => {
  const savedTheme = getTheme();
  setTheme(savedTheme);
  
  // Listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (getTheme() === THEMES.SYSTEM) {
        setTheme(THEMES.SYSTEM); // re-apply system preference
      }
    });
  }
};
