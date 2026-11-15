import { footerEmailLabel } from '@/components/character/luffyLines';
import EmailButton from '@/components/home/EmailButton';
import { getLifeStory } from '@/lib/lifeStory';

export default function Footer() {
  // The address comes from content/life-story.json, split so it isn't in the HTML.
  const email = getLifeStory().contact.email;

  return (
    <footer className="border-t border-ink/10 mt-24">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-muted font-mono">
        <span>&copy; {new Date().getFullYear()} Divyesh Bhavsar</span>
        <div className="flex gap-5">
          <a
            href="https://github.com/DivyeshRBhavsar"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-red-deep transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/divyesh-bhavsar-aaaa98152"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-red-deep transition-colors"
          >
            LinkedIn
          </a>
          {email && (
            <EmailButton parts={email} className="hover:text-red-deep transition-colors">
              {footerEmailLabel}
            </EmailButton>
          )}
        </div>
      </div>
    </footer>
  );
}
