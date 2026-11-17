import { useEffect, useState } from 'react';
import { iconElements } from '../icons/icons';

function Icon({ name }: { name: 'moon' | 'sun' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconElements(name, 16).map(([tag, a], i) => (tag === 'path' ? <path key={i} {...a} /> : tag === 'circle' ? <circle key={i} {...a} /> : <line key={i} {...a} />))}
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');
  useEffect(() => setTheme(document.documentElement.dataset.theme ?? 'light'), []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  };
  return (
    <button className="icon-btn" style={{ gap: 8, alignItems: 'center' }} onClick={toggle} aria-label="Toggle dark mode" data-testid="theme-toggle">
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
    </button>
  );
}
