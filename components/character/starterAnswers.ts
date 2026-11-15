/**
 * Ask Luffy's starter questions (the chips in the chat panel). Edit freely.
 *
 * They're answered live by the chatbot (/api/chat) like any question, with two
 * differences: asking one never counts toward the visitor's question limit, and its
 * answer is cached for 24 hours for everyone (so the model runs at most once a day per
 * starter). A message counts as a starter when it matches one of these exactly, ignoring
 * case, punctuation and emoji, so rewording one here simply starts a new cache entry.
 *
 *   id        stable key
 *   question  the chip label, and what's sent and shown as the visitor's message
 */

export type StarterQuestion = { id: string; question: string };

export const starterQuestions: StarterQuestion[] = [
  { id: 'projects', question: 'What projects has Divyesh built?' },
  { id: 'coast-capital', question: 'What did he do at Coast Capital Savings?' },
  { id: 'best-ai', question: "What's his strongest AI project?" },
  { id: 'services', question: 'What services does he offer?' },
  { id: 'education', question: "What's his education?" },
  { id: 'process', question: 'How does a project with him work?' },
];
