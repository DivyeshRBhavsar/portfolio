export default function Footer() {
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
          <a
            href="mailto:divyeshbhavsar567@gmail.com"
            className="hover:text-red-deep transition-colors"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
