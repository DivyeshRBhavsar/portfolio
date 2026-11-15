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

// ── 9. Skip to portfolio, Mini Luffy, Ask Luffy panel, working-on badge ──
// Buttons and screen-reader text. Edit freely.

export const replayWelcomeLabel = "Replay welcome 👋";
export const miniLuffyLabel = "Ask Luffy a question";
export const askPanelTitle = "Ask Luffy";
export const askPanelCloseLabel = "Close";
export const starterQuestionsLabel = "Questions you can ask";
export const askInputLabel = "Ask anything";
export const askSendLabel = "Send";
export const visitorSaidLabel = "You:";
export const luffySaidLabel = "Luffy:";

// After currentlyWorkingLabel and the repo name. {days} = number of days
export const updatedLabels = {
  today: "updated today",
  yesterday: "updated yesterday",
  days: "updated {days} days ago",
};

// ── 10. Projects page: list view and story mode ──────────────────────
// {nameComma} becomes ", Priya" when the name is known, or nothing.

// Story mode's picker
export const storyPickerLines: string[] = [
  "Which project shall we explore{nameComma}?",
  "Pick a project{nameComma}, and I'll walk you through it! 🎬",
  "Story time{nameComma}! Which project shall we explore?",
];

// After the last slide
export const storyEndLines: string[] = [
  "And that's the story! Want to see another one?",
  "That's how he did it! Want to see another one? 🎬",
  "The end… for now! Want to explore something else?",
];

// Narration for a slide whose narration is still a TODO
export const storyComingSoonLines: string[] = [
  "This part is still being written. Check back soon! ✍️",
  "Divyesh is still putting this part together. Stay tuned! 🛠️",
];

// Home page "last time" line when the last page was a story. {lastPage} = storyPageName
export const lastVisitStoryLines: string[] = [
  "Last time you checked out {lastPage}.",
  "I remember you were watching {lastPage}!",
];
// How a story is named in Luffy's sentences. {title} = the story's title.
// (The "Continue" chip uses the plain title.)
export const storyPageName = "the “{title}” story";

// Buttons and screen-reader text
export const projectsViewLabels = {
  group: "How to view the projects",
  list: "📋 List view",
  story: "🎬 Story mode with Luffy",
};
export const watchStoryLabel = "▶ Watch the story";
export const surpriseMeLabel = "Surprise me 🎲";
export const storyPickerListLabel = "Project stories";
export const comingSoonLabel = "Coming soon";
export const storyControls = {
  back: "Back",
  next: "Next",
  autoplay: "Autoplay",
  pause: "Pause",
  openRepo: "Open the repo ↗",
  close: "✕ Back to projects",
  closeShort: "✕",
  allStories: "← All stories",
  fullScreen: "⛶ Full screen",
  exitFullScreen: "⛶ Exit full screen",
  nextProject: "Next project →",
  askLuffy: "💬 Ask Luffy",
  backToList: "📋 Back to list",
};
export const storyControlLabels = {
  back: "Previous slide",
  next: "Next slide",
  autoplay: "Start autoplay",
  pause: "Pause autoplay",
  dots: "Slides",
  dot: "Go to slide {n}",
  openRepo: "Open the repo on GitHub (opens in a new tab)",
  close: "Close story mode and go back to the projects list",
  allStories: "Show all project stories",
  fullScreen: "Show story mode full screen",
  exitFullScreen: "Leave full screen",
};
// The story-mode overlay's name for screen readers (a story's uses storyRegionLabel)
export const storyModeLabel = "Story mode with Luffy: project stories";
export const slideCounterLabel = "Slide {n} of {total}";
export const storyRegionLabel = "Project story: {title}";

// Expertise categories (names, descriptions and skills live in lib/categories.ts).
// When a category chip is picked in story mode's picker. Keyed by category slug.
export const storyCategoryLines: Record<string, string[]> = {
  "ai-llm": [
    "AI it is! Language models and computer vision, my favourite kind of magic. 🧠",
    "Ooh, the AI ones! This is where Divyesh teaches machines to read and to see. Pick one!",
  ],
  "data-science": [
    "Data science! Real questions, real data, and models that answer them. 📊",
    "Good choice{nameComma}! These are the ones where the numbers tell the story.",
  ],
  "data-engineering": [
    "Pipelines and automation! Messy data in, clean data out. 🔧",
    "This is where Divyesh turns locked-away data into something useful. Pick one!",
  ],
  "software-development": [
    "Complete apps, from the interface down to the database. 💻",
    "Software it is{nameComma}! These ones are built to be used, not just run once.",
  ],
  "web-development": [
    "Web projects! You're looking at one of them right now. 🌐",
    "Websites with a bit of motion. Pick one and I'll show you how it was built!",
  ],
  other: [
    "A few experiments and smaller builds. Curious? Pick one!",
    "The odds and ends! Sometimes the side projects are the fun ones. 🧪",
  ],
};

export const categoryAllLabel = "All";
export const categoryChipsLabel = {
  projects: "Filter projects by expertise",
  stories: "Filter stories by expertise",
};
// Read after each chip's count by screen readers. {n} = the count
export const categoryCountLabels = {
  projects: { one: "1 project", other: "{n} projects" },
  stories: { one: "1 story", other: "{n} stories" },
};
export const categorySkillsLabel = "Skills";
export const cardTechLabel = "Built with";
export const cardCategoriesLabel = "Also in";

// ── 10. Blog: the reading room and the library ──
// Post pages (/blog/<slug>) and the index (/blog). Edit freely.
// Placeholders: {n} = a number, {total} = another number, {title} = a post title,
// {name} = a series name, {nameComma} = ", Priya" or nothing.

// Luffy's pick on /blog: one post a day (same for everyone that day).
export const blogPickLabel = "Luffy's pick";
export const blogPickLines = [
  "My pick for today! Grab a drink and get comfy. ☕",
  "If you only read one thing today, make it this one. 📖",
  "This one's a favourite of mine. Trust me on this!",
];

// Nothing matches the search or topic.
export const blogEmptyLines = [
  "Hmm, nothing matches that. Try another word, or clear the filters!",
  "I looked everywhere and found nothing. Maybe a different word?",
  "No posts like that yet. Divyesh might write one someday! ✍️",
];
export const blogClearFiltersLabel = "Clear filters";

// The library.
export const blogSearchLabel = "Search posts";
export const blogSearchPlaceholder = "Search titles, summaries and tags";
export const blogTopicChipsLabel = "Filter posts by topic";
export const blogTopicAllLabel = "All";
// Read after each chip's count by screen readers.
export const blogPostCountLabels = { one: "1 post", other: "{n} posts" };
export const blogResultsLabel = { one: "1 post", other: "{n} posts" };
export const blogAllPostsHeading = "All posts";
export const blogShelfHeading = "Continue reading";
export const blogShelfProgress = "{n}% read · {total} min left";
export const blogReadingTimeLabel = "{n} min read";
export const blogSeriesLabel = "{name} · Part {n}";
export const blogTopicLabel = "Topic";
export const blogLevelLabel = "Level";
export const blogTagsLabel = "Tags";

// Continue where you left off (post pages, when a reader comes back to an unfinished post).
export const continueReadingPrompts = [
  "Continue where you left off?",
  "Welcome back{nameComma}! Continue where you left off?",
];
export const continueResumeLabel = "Resume";
export const continueStartOverLabel = "Start over";

// The reading toolbar.
export const readerToolbarLabel = "Reading tools";
export const readerContentsLabel = "Contents";
export const readerMinutesLeft = "{n} min left";
export const readerDone = "Done 🎉";
export const readerProgressLabel = "Reading progress";
export const readerProgressValue = "{n}% read, {total} min left";
export const readerSettingsButton = "Aa";
export const readerSettingsButtonLabel = "Reader settings: text size, font and theme";
export const readerFocusLabel = "Focus mode";
export const readerExitFocusLabel = "Exit focus";
export const readerMoreLabel = "More reading tools";
export const readerTip = "Make it comfy: text size, font and night mode.";

// The reader settings dialog ("Aa").
export const readerSettingsTitle = "Reader settings";
export const readerSettingsDone = "Done";
export const readerSettingsGroups = {
  size: "Text size",
  width: "Line width",
  font: "Font",
  theme: "Reading theme",
};
// short = on the button, full = for screen readers and the tooltip
export const readerSizeOptions = {
  s: { short: "S", full: "Small" },
  m: { short: "M", full: "Medium" },
  l: { short: "L", full: "Large" },
  xl: { short: "XL", full: "Extra large" },
};
export const readerWidthOptions = {
  narrow: "Narrow",
  medium: "Medium",
  wide: "Wide",
};
export const readerFontOptions = {
  sans: "Sans",
  serif: "Serif",
  dyslexic: "Dyslexia-friendly",
};
export const readerThemeOptions = {
  auto: "Auto",
  paper: "Paper",
  sepia: "Sepia",
  night: "Night",
};
export const readerThemeAutoHint = "Follows the site's time-of-day theme";
// Marks the standard choice in each group.
export const readerDefaultLabel = "Default";
export const readerResetLabel = "Reset to default";
// Shown (and read out) for a moment after resetting.
export const readerResetDone = "Settings reset";

// ── 11. Home page life story ──
// The chapters under the stage (their titles and Luffy's lines are in
// content/life-story.json). Labels and Luffy's reactions here. Edit freely.

// The short intro under the stage (above "My story so far").
export const homeRoleLine = "AI Engineer & Data Scientist · AI Resident at Apziva";
// How the "portfolio" story slug is named on cards (it links to the web projects).
export const homeStoryPortfolioTitle = "This portfolio site";

// Chapter 1
export const homeCertificationsLabel = "Certifications";

// Named story links on the home page: "<label> <Project name> ▶". Screen readers hear
// "{prefix}: <Project name>".
export const homeWatchStoryPrefix = "Watch the story";

// Chapter 2
export const homeDidLabel = "What I did";
export const homeLearnedLabel = "What I learned";
export const homeKindLabels = { software: "Software", data: "Data" };
export const homeExperienceViewLabel = "How to show my experience";
export const homeExperienceViews = { timeline: "Timeline", query: "Query my experience" };

// The SQL terminal (Chapter 2, "Query my experience")
export const sqlTerminalTitle = "career.sql";
export const sqlPresetsLabel = "Ready-made queries";
export const sqlPresets = [
  { label: "Latest 3 jobs", sql: "SELECT role, company, start FROM career ORDER BY start DESC LIMIT 3" },
  { label: "What he does now", sql: "SELECT role, company FROM career WHERE end = 'present'" },
  { label: "Software roles", sql: "SELECT company, role FROM career WHERE kind = 'software'" },
  { label: "Degrees", sql: "SELECT degree, school, end FROM education" },
  { label: "AI toolbox", sql: "SELECT skill FROM toolbox WHERE track = 'AI Engineer'" },
];
export const sqlInputLabel = "Your SQL query";
export const sqlPlaceholder = "SELECT * FROM career WHERE kind = 'data'";
export const sqlRunLabel = "Run";
export const sqlTablesHint = "Tables: career (role, company, kind, place, start, end) · education (degree, field, school, start, end) · toolbox (skill, track)";
export const sqlResultLabel = "Query result";
export const sqlRowCount = { one: "1 row", other: "{n} rows" };
export const sqlNull = "—";
// Luffy's reactions to a query. {n} = number of rows
export const sqlSuccessLines = [
  "{n} rows, coming right up! 📊",
  "Nice query! Here's what I found.",
  "Look at you, writing SQL! Here you go.",
];
export const sqlEmptyLines = [
  "Hmm, no rows match that. Try a looser filter?",
  "Nothing there! Maybe try LIKE with a % or two.",
];
export const sqlErrorLines = [
  "Oops, I couldn't read that one. Check the note below!",
  "That one tripped me up. Here's what went wrong:",
  "Almost! I only speak simple SQL. Here's the problem:",
];
export const sqlIdleLine = "Pick a query or write your own. I'll run it on Divyesh's career!";
// What went wrong ({table}, {column}, {columns}, {word} are filled in).
export const sqlErrors = {
  empty: "Type a query first, for example: SELECT * FROM career",
  notSelect: "I only understand SELECT queries: SELECT … FROM … [WHERE …] [ORDER BY …] [LIMIT …]",
  noFrom: "A query needs FROM and a table: career, education or toolbox.",
  unknownTable: "There's no table '{table}'. Try career, education or toolbox.",
  unknownColumn: "There's no column '{column}' in {table}. Try: {columns}.",
  unsupported: "'{word}' isn't supported here. I understand WHERE with =, !=, LIKE, < and >, joined by AND, plus ORDER BY and LIMIT.",
  badValue: "Expected a value after {word}: text in single quotes like 'data', or a number.",
  badOperator: "Expected =, !=, LIKE, < or > after {column}.",
  unclosedString: "A text value is missing its closing quote (').",
  badLimit: "LIMIT needs a whole number, like LIMIT 3.",
  unexpected: "I didn't expect '{word}' there.",
  noColumns: "List the columns to show after SELECT (or * for all of them).",
};

// Chapter 3
export const homeRolePickerLabel = "Pick a role";
export const homePitchHeading = "Why me";
export const homeEvidenceHeading = "The proof";
export const homeTrackExperienceHeading = "Where I've done it";
export const homeSkillsHeading = "Skills";
export const homeDownloadResume = "Download résumé";
export const homePrinciplesHeading = "How I work";
// Shown before the story's name under each principle.
export const homeProofLink = "See the proof:";

// Chapter 4. {date} = e.g. "November 2026"
export const homeLastUpdated = "Last updated {date}";
export const homeRepoOnGitHub = "on GitHub";

// Let's talk
export const homeLinkedInLabel = "LinkedIn";
export const homeEmailLabel = "Email me";
export const homeContactPageLabel = "Contact page";
export const footerEmailLabel = "Email";

// ── 12. Work with me ──
// The /work-with-me page for clients. Its content (services, process, FAQ, planner
// questions) is in content/services.json; the labels and Luffy's own lines are here.

// Header and footer
export const navWorkWithMe = "Work with me";
export const navMenuOpen = "Open menu";
export const navMenuClose = "Close menu";

// Page title (browser tab)
export const workMetaTitle = "Work with me — Divyesh Bhavsar";

// Hero: the capacity badge's expandable detail
export const workCapacityMore = "Why?";
export const workCapacityLess = "Hide";

// "What would you like to fix?"
export const workShowEverything = "Show me everything";

// Service cards
export const workServicesHeading = "What I can build for you";
export const workNeedIfHeading = "You might need this if…";
export const workYouGetHeading = "What you get";
export const workStepsHeading = "How it goes";
// Shown before the named story links on each card.
export const workProofLabel = "See similar work:";
export const workTechToggle = "What I'd use";
export const workPlanButton = "Plan this project";
export const workTalkButton = "Talk about this";

// How a project works (screen readers hear "Checkpoint: ..." for the ✓ line)
export const workCheckpointLabel = "Checkpoint";

// When will it be done?
export const workFactorsHeading = "What affects the timeline";

// FAQ
export const workFaqHeading = "Questions people ask";

// Plan my project. {n} of {total}; {title} = the chosen service's name.
export const workPlannerProgress = "{n} of {total}";
export const workPlannerBack = "Back";
export const workPlannerStartOver = "Start over";
export const workPlannerSend = "Send this plan to Divyesh";
export const workPlannerChosen = "You picked: {title}";
export const workPlannerResultLine = "Here's how your project would go. Not bad, right?";
export const workPlannerResultTitle = "Your project plan";
export const workPlannerStepsHeading = "The steps";
export const workPlannerNeedHeading = "What I'd need from you";
export const workPlannerNotesHeading = "Good to know";
export const workPlannerAgreed = "The timeline and price are agreed in the written proposal, after a free call and a look at your data. You approve both before any work starts.";
// First line of the plan summary sent to the contact page.
export const workPlannerSummaryService = "Service";

// Closing call to action
export const workClosingTitle = "Have a project in mind?";
export const workClosingLuffy = "Tell Divyesh what you'd like to fix. The first call is free, and there's no obligation!";
export const workClosingButton = "Talk about your project";

// ── 13. Contact ──
// The contact page. The purposes and their fields are in content/contact.json; the
// labels, Luffy's lines and the error messages (shown by the form and the server) here.

// Greeting (one picked at random). {nameComma} = ", Priya" when the name is known.
export const contactGreetings = [
  "Hi{nameComma}! What brings you here?",
  "Hey{nameComma}! What can Divyesh help you with?",
  "Hi{nameComma}! Pick what fits and I'll pass it on to Divyesh.",
];
// Under the greeting. {divyeshTime} e.g. "8:15 pm", {city} = DIVYESH_CITY.
// "Soon" between 9:00 and 21:00 Toronto time, otherwise "tomorrow morning".
export const contactTimeSoon = "It's {divyeshTime} in {city} right now, so Divyesh will likely reply soon.";
export const contactTimeLater = "It's {divyeshTime} in {city} right now, so Divyesh will likely reply tomorrow morning.";

// Modes
export const contactModeFull = "Show me the full form";
export const contactModeChat = "Chat with Luffy instead";

// Headings and labels
export const contactPurposeHeading = "What's this about?";
export const contactDetailsHeading = "The details";
export const contactAboutYouHeading = "About you";
export const contactNameLabel = "Your name";
export const contactEmailLabel = "Your email";
export const contactMessageLabel = "Your message";
export const contactLinkedInLabel = "Your LinkedIn profile";
export const contactLinkedInPlaceholder = "https://linkedin.com/in/…";
export const contactOptional = "(optional)";
export const contactSelectPlaceholder = "Choose one";
export const contactAboutGroups = { projects: "Projects", posts: "Blog posts" };
// {n} characters typed of {total}
export const contactCharCount = "{n} / {total}";
export const contactPlanTitle = "Your project plan";
export const contactPlanRemove = "Remove plan";
// Changing the purpose. {title} = the old purpose.
export const contactPurposeCleared = "Details for {title} cleared.";
export const contactUndo = "Undo";
export const contactDismiss = "Dismiss";
export const contactDraftRestored = "Restored your draft";
export const contactDraftClear = "Clear";
export const contactSend = "Send message";
export const contactSending = "Sending…";
export const contactFixErrors = "A few things need a look. I've marked them below.";

// Live summary
export const contactSummaryTitle = "How your message will look";
export const contactSummaryToggle = "Preview your message";
export const contactSummaryEmpty = "Pick what this is about to see a preview.";
export const contactSummaryFrom = "From";

// Chat mode. {title} = a field's label.
export const contactChatProgress = "{n} of {total}";
export const contactChatAsk = "{title}?";
// The chat's first question (the band at the top already says hello).
export const contactChatPurpose = "Pick whichever fits best and we'll take it from there.";
export const contactChatName = "What's your name?";
export const contactChatEmail = "And the best email to reply to?";
export const contactChatMessage = "What would you like to say to Divyesh?";
export const contactChatOptional = "Want to add anything else?";
export const contactChatReview = "All set! Here's what I'll send. Look good?";
export const contactBack = "Back";
export const contactNext = "Next";
export const contactSkip = "Skip";
export const contactChangeSomething = "Change something";

// Under the form
export const contactLinkedInButton = "LinkedIn";
export const contactCopyEmail = "Copy email";
export const contactCopied = "Email copied!";
export const contactCopyFallback = "Couldn't copy it automatically. Here it is:";
export const contactBookCall = "Book a 15-minute call";

// After sending
export const contactSuccessLine = "Sent! 🎉 Divyesh will get back to you soon.";
export const contactNextStory = "Watch a project story";
export const contactNextBlog = "Read the blog";
export const contactErrorLine = "Oops, that didn't go through. Give it another try in a moment, or copy the email and write to Divyesh directly.";
export const contactTryAgain = "Try again";

// Errors (the server sends the same ones). {title} = a field's label, {n} = a number.
export const contactErrors = {
  required: "{title} is required.",
  nameRequired: "Please tell me your name.",
  emailRequired: "Please add your email so Divyesh can reply.",
  messageRequired: "Please write a short message.",
  tooLong: "{title} must be {n} characters or fewer.",
  tooShort: "{title} needs at least {n} characters.",
  email: "That email doesn't look right. Check for typos?",
  url: "Please enter a full link, starting with https://",
  option: "Please pick one of the options for {title}.",
  purpose: "Please pick what this is about.",
  tooFast: "That was quick! Please take a moment, then send it again.",
  cooldown: "You just sent a message. Please wait a minute before sending another.",
  notConfigured: "Sending isn't set up on this site yet. Please copy the email and write directly.",
  failed: "Something went wrong sending your message.",
  invalid: "That message couldn't be read. Please try again.",
};

// Links to the contact page from elsewhere. {title} = "an AI Engineer", "a Data Scientist".
export const contactHireMe = "Hire me as {title}";
export const contactAskAboutProject = "Ask about this project";
export const contactDiscussPost = "Discuss this post";

// ── 14. Page heroes ──
// The band at the top of Projects, Blog and Contact (components/PageHero.tsx; Work with
// me's text comes from content/services.json). Luffy says one of his lines at random.
// Counts use {n}.

export const projectsHeroTitle = "Projects";
export const projectsHeroSubtitle = "Real problems, honest numbers, and the stories behind them.";
export const projectsHeroLines = [
  "Pick a project, or let me tell you its story!",
  "Every project here has a story. Want me to tell you one?",
  "Browse the list, or switch to Story mode and I'll walk you through it!",
];
// "12 projects · 7 stories · 5 areas"
export const projectsHeroCounts = {
  projects: { one: "1 project", other: "{n} projects" },
  stories: { one: "1 story", other: "{n} stories" },
  areas: { one: "1 area", other: "{n} areas" },
};
export const projectsHeroGitHub = "Live from GitHub";

export const blogHeroTitle = "Blog";
export const blogHeroSubtitle = "Lessons from building things, written for curious readers.";
export const blogHeroLines = [
  "Grab a coffee ☕, there's plenty to read.",
  "Pull up a chair! Divyesh writes these for curious people like you.",
  "Short on time? Pick a topic, or let me pick a post for you.",
];
// "6 posts · ~48 min of reading"
export const blogHeroCounts = {
  posts: { one: "1 post", other: "{n} posts" },
  minutes: "~{n} min of reading",
};

// Contact (Luffy greets with contactGreetings, in section 13).
export const contactHeroTitle = "Let's talk";
export const contactHeroSubtitle = "Tell me what you have in mind, and I'll get back to you.";

// ── 15. Ask Luffy chat ──
// The chat panel (Mini Luffy, the home "Ask Luffy" chip, the story-end button). Luffy's
// answers come from /api/chat; these are the panel's own labels and lines.
// {n} / {total} placeholders are filled in automatically.

export const chatCharCount = "{n} / {total}";
export const chatCounter = "{n} of {total} questions";
// When the visitor unlocks more questions. {n} = how many more.
export const chatUnlockLines = [
  "You've unlocked {n} more questions! 🎉",
  "Great questions! That unlocks {n} more 🎉",
];
export const chatClear = "Clear chat";
export const chatTrustLine = "Luffy is an AI and can make mistakes. Answers come from Divyesh's site content.";
export const chatSourcesLabel = "Sources";
export const chatSourcePrefix = "📖";
export const chatThinkingLabel = "Luffy is thinking";
export const chatContinueButton = "Continue with Divyesh →";
export const chatContactButton = "Contact Divyesh";
export const chatTryAgain = "Try again";
// Under the conversation once it has ended (the input is disabled for this visit).
export const chatEndedNotes = {
  limit: "That's all the questions for this visit. Divyesh can take it from here!",
  flow_complete: "We've covered a lot! The best next step is talking to Divyesh.",
  off_track: "Luffy is napping for the rest of this visit.",
  daily_cap: "Luffy is resting until tomorrow.",
  unavailable: "Luffy can't answer right now.",
};
// Problems sending a question.
export const chatErrors = {
  busy: "One question at a time, please! I'm still answering the last one.",
  rejected: "Hmm, I couldn't take that one. Could you rephrase it in under 300 characters?",
  network: "I couldn't reach my notes just now. Check your connection and try again?",
};
// From a story's "Ask Luffy" button: put in the input (not sent). {title} = the story.
export const chatStoryPrefill = "Tell me more about {title}";
