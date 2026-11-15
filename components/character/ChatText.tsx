import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Luffy's answer text with a tiny, safe subset of formatting, built only from React
 * elements (never raw HTML): paragraphs (blank lines), bullet lists ("- " or "* "),
 * **bold**, and links, but only to this site ("/…") or https. Markdown links, bare
 * https URLs and bare site paths (/projects, /blog/…, /work-with-me, /contact) become
 * links; anything else stays plain text.
 */

const INLINE =
  /\*\*(.+?)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)|(https:\/\/[^\s<>()]+)|(?<![\w/])(\/(?:projects|blog|work-with-me|contact)(?:\/[a-z0-9-]+)?(?:\?[^\s<>()]*)?)/g;

const linkClass = 'font-medium text-red-deep underline underline-offset-2 hover:no-underline';

/** Only this site ("/…", not "//…") or https. */
const allowed = (href: string) => (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('https://');

/** A safe link, or null if the address isn't allowed. */
function SafeLink({ href, children, onFollow }: { href: string; children: ReactNode; onFollow?: () => void }) {
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link href={href} onClick={onFollow} className={linkClass}>
        {children}
      </Link>
    );
  }
  if (href.startsWith('https://')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
      </a>
    );
  }
  return null;
}

/** Split trailing punctuation off a bare address ("/projects." → "/projects" + "."). */
function trimTrailing(url: string): [string, string] {
  const m = url.match(/^(.*?)([.,!?;:'"]+)$/);
  return m ? [m[1], m[2]] : [url, ''];
}

function inline(text: string, onFollow: (() => void) | undefined, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyBase}-${i++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      out.push(
        allowed(m[3]) ? (
          <SafeLink key={key} href={m[3]} onFollow={onFollow}>
            {m[2]}
          </SafeLink>
        ) : (
          m[2]
        )
      );
    } else {
      const [url, tail] = trimTrailing(m[4] ?? m[5]);
      out.push(
        <SafeLink key={key} href={url} onFollow={onFollow}>
          {url}
        </SafeLink>
      );
      if (tail) out.push(tail);
    }
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const BULLET = /^\s*[-*•]\s+/;

export default function ChatText({ text, onFollow }: { text: string; onFollow?: () => void }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <>
      {blocks.map((block, b) => {
        // Group consecutive bullet lines into lists; other lines into paragraphs.
        const lines = block.split('\n').filter((l) => l.trim());
        const groups: { list: boolean; lines: string[] }[] = [];
        for (const line of lines) {
          const list = BULLET.test(line);
          const last = groups[groups.length - 1];
          if (last && last.list === list) last.lines.push(line);
          else groups.push({ list, lines: [line] });
        }
        return groups.map((g, gi) =>
          g.list ? (
            <ul key={`${b}-${gi}`} className="my-1 list-disc space-y-0.5 pl-5">
              {g.lines.map((l, li) => (
                <li key={li}>{inline(l.replace(BULLET, ''), onFollow, `${b}-${gi}-${li}`)}</li>
              ))}
            </ul>
          ) : (
            <p key={`${b}-${gi}`} className="[&:not(:first-child)]:mt-2">
              {g.lines.map((l, li) => (
                <span key={li}>
                  {li > 0 && <br />}
                  {inline(l, onFollow, `${b}-${gi}-${li}`)}
                </span>
              ))}
            </p>
          )
        );
      })}
    </>
  );
}
