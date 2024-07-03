'use client';

import Link from 'next/link';

interface SiteDirectoryProps {
  layout: 'topbar' | 'sidebar';
  links: Array<{ href: string; label: string }>;
}

export default function SiteDirectory({ layout, links }: SiteDirectoryProps) {
  const isTopbar = layout === 'topbar';

  return (
    <nav className={isTopbar ? 'top-bar' : 'sidebar'}>
      <ul className={isTopbar ? 'flex' : 'flex flex-col'}>
        {links.map((link) => (
          <li key={link.href} className="p-2">
            <Link href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}