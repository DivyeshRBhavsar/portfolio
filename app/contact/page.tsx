import ContactForm from '@/components/ContactForm';

export const metadata = { title: 'Contact — Divyesh Bhavsar' };

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <p className="font-mono text-sm text-teal-400 mb-2">/ contact</p>
      <h1 className="font-display text-3xl font-bold text-ink-100 mb-3">Get in touch</h1>
      <p className="text-ink-300 mb-10">
        Have a role, project, or question in mind? Send a message directly &mdash; it goes
        straight to my inbox.
      </p>
      <ContactForm />
    </div>
  );
}
