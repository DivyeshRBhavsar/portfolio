/**
 * Ask Luffy's starter questions (the chips in the Q&A panel) and their answers.
 *
 * TODO(Divyesh): replace every answer marked "TODO" with your own words.
 *
 * Format, kept simple on purpose:
 *   id        stable key (keep it if you reword the question)
 *   question  the chip label, and what shows as the visitor's message
 *   answer    plain text only (no HTML or Markdown); it types out like Luffy's other lines
 *   links     optional buttons under the answer. "/projects" stays on the site;
 *             "https://…" opens in a new tab.
 *
 * Later, the RAG chatbot can answer free-text questions and these can stay as the
 * suggested starters (or be swapped for its answers) without changing the panel.
 */

export type StarterLink = { label: string; href: string };

export type StarterAnswer = {
  id: string;
  question: string;
  answer: string;
  links?: StarterLink[];
};

export const starterAnswers: StarterAnswer[] = [
  {
    id: 'projects',
    question: '🗂️ What are your best projects?',
    answer:
      "TODO: In 2–3 sentences, name the projects you're proudest of and what each one shows (the problem, what you built, the result).",
    links: [{ label: 'See all projects', href: '/projects' }],
  },
  {
    id: 'experience',
    question: '💼 What experience do you have?',
    answer:
      'TODO: A short summary of your roles (for example the Apziva AI Residency, credit union analytics, financial data validation) and what you did in each.',
  },
  {
    id: 'ml',
    question: '🧠 What ML work have you done?',
    answer:
      "TODO: The models you've built, which ones made it past the notebook, and one concrete result.",
    links: [{ label: 'ML projects', href: '/projects' }],
  },
  {
    id: 'skills',
    question: '🛠️ What are your main skills?',
    answer:
      'TODO: Your core tools and languages, grouped (data analysis, machine learning, engineering), with the ones you use most first.',
  },
  {
    id: 'availability',
    question: "📅 Are you open to new roles?",
    answer:
      "TODO: What you're looking for (role types, full-time or contract, remote or in Waterloo) and when you could start.",
    links: [{ label: 'Get in touch', href: '/contact' }],
  },
  {
    id: 'contact',
    question: '✉️ How can I reach you?',
    answer: 'TODO: The best way to get in touch, and how quickly you usually reply.',
    links: [{ label: 'Contact page', href: '/contact' }],
  },
];
