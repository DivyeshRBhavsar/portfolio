// Luffy's lines: everything he says on the home page.
// Edit freely. Placeholders get filled in automatically:
//   {name}          visitor's name (only used in lines meant for named visitors)
//   {visitorTime}   visitor's local time, e.g. "9:15 pm"
//   {divyeshTime}   Divyesh's time in Waterloo, Ontario, e.g. "10:45 am"
// One line is picked at random from each list, so add as many as you like.

export const DIVYESH_TIMEZONE = "America/Toronto"; // Kitchener-Waterloo, Ontario
export const DIVYESH_CITY = "Waterloo";

// Time slots use the VISITOR's local clock.
//   earlyMorning 5–8 · morning 8–12 · afternoon 12–17 · evening 17–21 · night 21–24 · lateNight 0–5
export type TimeSlot =
  | "earlyMorning"
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "lateNight";

// ── 1. First greeting ────────────────────────────────────────────────

// New visitor (no name yet)
export const newVisitorGreetings: Record<TimeSlot, string[]> = {
  earlyMorning: [
    "Wow, an early riser! 🌅 Namaste, and welcome to Divyesh's corner of the internet.",
    "Good morning, early bird! 🐦 Namaste and welcome!",
    "The sun's barely up and you're already here. I like you! Namaste! 🌅",
  ],
  morning: [
    "Good morning! ☀️ Namaste, and welcome to Divyesh's corner of the internet.",
    "Morning! ☀️ Grab your coffee, and welcome aboard.",
    "Good morning and namaste! Perfect time for a fresh look around. ☀️",
  ],
  afternoon: [
    "Good afternoon! 🌤️ Namaste, and welcome to Divyesh's corner of the internet.",
    "Afternoon! 🌤️ Taking a break? You picked a good place.",
    "Good afternoon and namaste! Ready for a quick tour? 🌤️",
  ],
  evening: [
    "Good evening! 🌆 Namaste, and welcome to Divyesh's corner of the internet.",
    "Evening! 🌆 Glad you stopped by after a long day.",
    "Good evening and namaste! The lights are on, come on in. 🌆",
  ],
  night: [
    "Good evening! 🌙 Namaste, and welcome. Let's keep it cosy.",
    "Hello, night owl! 🦉 Namaste and welcome!",
    "Winding down for the night? 🌙 Perfect time to explore.",
  ],
  lateNight: [
    "Up late? 🌙 Me too. Namaste, and welcome!",
    "Burning the midnight oil? 🕯️ You're in good company. Welcome!",
    "Shh… it's the quiet hours. 🌙 Let's explore together.",
  ],
};

// Returning visitor WITH a name
export const returningGreetings: Record<TimeSlot, string[]> = {
  earlyMorning: [
    "Good morning, {name}! 🌅 Back so early? Welcome back!",
    "{name}! An early start again. 🌅 Great to see you.",
  ],
  morning: [
    "Good morning, {name}! ☀️ Welcome back!",
    "Morning, {name}! ☀️ Missed you. Ready for round two?",
  ],
  afternoon: [
    "Good afternoon, {name}! 🌤️ Welcome back!",
    "Hey {name}! 🌤️ Good to see you again this afternoon.",
  ],
  evening: [
    "Good evening, {name}! 🌆 Welcome back!",
    "{name}! 🌆 Back for an evening visit. Welcome!",
  ],
  night: [
    "Good evening, {name}! 🌙 Welcome back.",
    "Hey {name}, night owl! 🦉 Welcome back.",
  ],
  lateNight: [
    "{name}! 🌙 Up late again? Welcome back.",
    "Welcome back, {name}! 🌙 The quiet hours are the best for exploring.",
  ],
};

// Returning visitor who skipped the name question last time
export const returningNoNameGreetings: Record<TimeSlot, string[]> = {
  earlyMorning: ["Good morning, and welcome back! 🌅"],
  morning: ["Good morning, welcome back! ☀️", "Hey, you're back! ☀️ Good morning!"],
  afternoon: ["Good afternoon, welcome back! 🌤️", "Hey, you're back! 🌤️"],
  evening: ["Good evening, welcome back! 🌆", "Hey, you're back! 🌆"],
  night: ["Welcome back, night owl! 🦉"],
  lateNight: ["Up late again? 🌙 Welcome back!"],
};

// Weekend bonus line (Saturday/Sunday, visitor's time). Shown after the greeting, sometimes.
export const weekendLines: string[] = [
  "Happy weekend! 🎉 Browsing for fun or for work?",
  "Weekend vibes! 😎 No rush at all.",
];

// ── 2. Time-zone line (visitor's time vs Divyesh's time) ─────────────

// Visitor is in roughly the same time zone as Divyesh (within 1 hour)
export const sameTimezoneLines: string[] = [
  "Looks like you're on Divyesh's clock too. It's {divyeshTime} here in {city}! 🍁",
  "Same time zone as Divyesh! Hello, neighbour 🍁",
];

// Different time zone, and Divyesh is probably awake and working (Toronto 9:00–18:00)
export const diffTzWorkingLines: string[] = [
  "It's {visitorTime} for you and {divyeshTime} for Divyesh in {city}. He's probably coding right now 💻",
  "Fun fact: it's {divyeshTime} in {city} right now, so Divyesh is likely deep in some data 📊",
];

// Different time zone, Divyesh awake but off work (Toronto 7:00–9:00 or 18:00–23:00)
export const diffTzFreeLines: string[] = [
  "It's {visitorTime} for you and {divyeshTime} for Divyesh in {city}. He's probably winding down ☕",
  "Over in {city} it's {divyeshTime}. Divyesh might be making music or reading up on something new 🎧",
];

// Different time zone, Divyesh is probably asleep (Toronto 23:00–7:00)
export const diffTzSleepingLines: string[] = [
  "It's {visitorTime} for you, but {divyeshTime} in {city}. Divyesh is asleep, so I'm on duty! 😴",
  "Shh… it's {divyeshTime} in {city} and Divyesh is sleeping. Lucky you get me instead! 🌙",
];

// ── 3. Asking the name ───────────────────────────────────────────────

export const askNameLines: string[] = [
  "I'm Luffy, Divyesh's guide. What should I call you?",
  "I'm Luffy! 👋 What's your name?",
  "I'm Luffy, your guide today. Mind telling me your name?",
];

export const nameInputPlaceholder = "Type your name…";
export const nameSubmitLabel = "Let's go →";
export const nameSkipLabel = "Skip, just browsing";

// After the visitor gives a name
export const nameThanksLines: string[] = [
  "Nice to meet you, {name}! 🤝",
  "{name}! Great name. Nice to meet you! 😄",
  "Welcome aboard, {name}! 🚀",
];

// After the visitor skips the name
export const nameSkippedLines: string[] = [
  "No problem at all! Let's keep it mysterious 🕵️",
  "Totally fine! Let's dive in 😊",
];

// ── 4. "What brings you here?" ───────────────────────────────────────

export const intentQuestionNew: string[] = [
  "What brings you here today?",
  "So, what would you like to see first?",
];

export const intentQuestionReturning: string[] = [
  "What would you like to see this time?",
  "Want to pick up where you left off, or see something new?",
];

// "Last time" line (returning visitors who visited a page before). {lastPage} = e.g. "Projects"
export const lastVisitLines: string[] = [
  "Last time you checked out his {lastPage}.",
  "I remember you liked his {lastPage} last time!",
];

// ── 5. Idle nudges (no interaction for a while) ──────────────────────

export const idleNudgeLines: string[] = [
  "Take your time, I'll be right here 😊",
  "No rush! Tap anything when you're ready.",
  "Psst… the tour only takes a minute ⏱️",
];

// ── 6. Mini Luffy (after "Skip to portfolio") ────────────────────────

export const miniLuffyTooltips: string[] = [
  "Need help? Tap me!",
  "Questions? I'm here 👋",
];

export const miniLuffyChatOpenLines: string[] = [
  "Hi{nameComma}! What would you like to know about Divyesh's work?",
  "Ask me anything about his projects{nameComma}! 💬",
];
// {nameComma} becomes ", Priya" when the name is known, or nothing.

// ── 7. "Currently working on" badge ──────────────────────────────────

export const currentlyWorkingLabel = "🔨 Currently working on:";

// ── 8. Labels on the home stage ──────────────────────────────────────
// Buttons, links and screen-reader text around the conversation. Edit freely.

export const loadingText = "Getting things ready…";
export const skipIntroLabel = "Skip intro";
export const skipToPortfolioLabel = "Skip to portfolio ↓";
export const forgetMeLabel = "Not you? Forget me";
export const nameInputLabel = "Your name";
export const typingIndicatorLabel = "Luffy is typing";
export const luffyAlt = "Luffy, a cartoon guide in a red hoodie and backwards black cap, smiling";

// Intent chips. {lastPage} = e.g. "Projects"
export const chipLabels = {
  tour: "🚀 Give me the tour",
  hiring: "💼 I'm hiring",
  ml: "🧠 ML projects",
  blog: "✍️ Blog",
  ask: "💬 Ask Luffy",
  continue: "↩️ Continue: {lastPage}",
  whatsNew: "✨ What's new",
  tourAgain: "🚀 Tour again",
};

// How pages are named in {lastPage}. Blog posts use their title: {title}
export const pageNames: Record<string, string> = {
  "/projects": "Projects",
  "/blog": "Blog",
  "/contact": "Contact page",
};
export const blogPostName = "post “{title}”";
export const blogPostFallbackName = "blog";
export const stageLabel = "Meet Luffy, Divyesh's guide";
