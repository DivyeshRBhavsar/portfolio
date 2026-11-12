'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/theme/ThemeToggle';

const links = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="site-header border-b border-ink/10 sticky top-0 z-40 backdrop-blur bg-cream/85">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link href="/" className="font-display font-bold text-lg tracking-tight text-ink">
          Divyesh<span className="text-red-deep">.</span>Bhavsar
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          <nav className="flex flex-wrap gap-1 font-mono text-sm">
            {links.map((link) => {
              const active =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-3 py-1 transition-colors duration-300 ${
                    active
                      ? 'text-red-deep font-medium underline decoration-2 underline-offset-4'
                      : 'text-ink hover:text-red-deep'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
