'use client';

import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { Icons } from './Icons';

interface TopBarProps {
  links: Array<{ href: string; label: string }>;
}

export default function TopBar({ links }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-light-background dark:bg-dark-background shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <ul className="flex space-x-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className="text-light-text-primary dark:text-dark-text-primary hover:text-light-primary-light dark:hover:text-dark-primary-light transition-colors duration-200 font-medium"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background hover:bg-light-primary-dark dark:hover:bg-dark-primary-light transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-light-primary-dark dark:focus:ring-dark-primary-light focus:ring-opacity-50"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun/>}
          </button>
        </div>
      </div>
    </nav>
  );
}