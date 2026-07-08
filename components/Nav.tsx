import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export default function Nav() {
  return (
    <header className="border-b border-navy-700/60 sticky top-0 z-40 backdrop-blur bg-navy-900/80">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-lg tracking-tight text-ink-100">
          Divyesh<span className="text-teal-400">.</span>Bhavsar
        </Link>
        <nav className="flex gap-6 font-mono text-sm text-ink-300">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-teal-400 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
