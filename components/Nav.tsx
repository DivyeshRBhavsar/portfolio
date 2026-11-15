'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { navMenuClose, navMenuOpen, navWorkWithMe } from '@/components/character/luffyLines';

const links = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/work-with-me', label: navWorkWithMe },
  { href: '/contact', label: 'Contact' },
];

const MENU_ID = 'site-menu';

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  /** Close the phone menu and give focus back to its button. */
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  // While open: Esc or a click/tap outside the header closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        // After the browser's own focus change for this press: back to the menu button,
        // unless the press landed on something focusable (then that keeps focus).
        setTimeout(() => {
          const active = document.activeElement;
          if (!active || active === document.body) buttonRef.current?.focus({ preventScroll: true });
        }, 0);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const linkClass = (active: boolean) =>
    `rounded-full px-3 py-1 transition-colors duration-300 ${
      active ? 'text-red-deep font-medium underline decoration-2 underline-offset-4' : 'text-ink hover:text-red-deep'
    }`;

  return (
    <header ref={headerRef} className="site-header border-b border-ink/10 sticky top-0 z-40 backdrop-blur bg-cream/85">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link href="/" className="font-display font-bold text-lg tracking-tight text-ink">
          Divyesh<span className="text-red-deep">.</span>Bhavsar
        </Link>

        {/* sm and up: the links in a row. */}
        <div className="hidden sm:flex flex-wrap items-center gap-1">
          <nav className="flex flex-wrap gap-1 font-mono text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={linkClass(isActive(link.href))}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>

        {/* Phones: a menu button. */}
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={MENU_ID}
          aria-label={open ? navMenuClose : navMenuOpen}
          onClick={() => setOpen((o) => !o)}
          className="sm:hidden -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:text-red-deep"
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      <div
        id={MENU_ID}
        hidden={!open}
        className="sm:hidden absolute inset-x-0 top-full border-b-2 border-ink/10 bg-cream shadow-sticker"
      >
        <nav className="mx-auto flex max-w-5xl flex-col px-4 py-3 font-mono">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              onClick={close}
              className={`flex min-h-11 items-center ${linkClass(isActive(link.href))}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-1 flex items-center border-t border-ink/10 px-1.5 pt-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
