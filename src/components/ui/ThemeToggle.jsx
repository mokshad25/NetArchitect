import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/useTheme.js';
import IconButton from './IconButton.jsx';

/** Sun / moon toggle for light and dark themes. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <IconButton label={`Switch to ${next} theme`} onClick={toggle}>
      {theme === 'dark' ? (
        <Sun size={18} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Moon size={18} strokeWidth={1.5} aria-hidden="true" />
      )}
    </IconButton>
  );
}
