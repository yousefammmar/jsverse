// Motivation + badge content. Edit here; xp.js and the dashboard pick it up.
export const QUOTES = [
  'Every expert was once a beginner who kept going.',
  'Bugs are just lessons wearing a disguise.',
  'Small steps daily beat big leaps rarely.',
  'You do not need to be great to start, but you need to start to be great.',
  'Errors in the console mean the computer is talking to you. Listen.',
  'Today’s confusing code is tomorrow’s easy win.',
  'Progress, not perfection.',
  'It works on my machine is a perfectly good first draft.',
  'Semicolons are optional. Confidence is not.'
];
export const GREETINGS = ['Another day. Another bug defeated.', 'Welcome back, console cowboy.', 'Ready to break something on purpose?', 'The computer is waiting for instructions.', 'Good to see you. The brackets missed you.'];
export const BADGES = [   // legacy list, kept for compatibility. Achievements live in data/achievements.js
  ['first', 'First Steps', 'Earn your first XP', s => s.xp > 0],
  ['l3', 'Level 3', 'Reach level 3', s => s.level >= 3],
  ['streak3', 'On Fire', 'Keep a 3-day streak', s => s.streak >= 3],
  ['lessons5', 'Bookworm', 'Complete 5 lessons', s => s.lessons >= 5],
  ['katas', 'Kata Master', 'Solve every kata', s => s.katas >= 3],
  ['tracker', 'Telemetry Pro', 'Fire a lab event', s => s.lab]
];
// XP awarded per action (unchanged from the first version).
export const XP = { lesson: 50, kata: 75, quizPerAnswer: 10, lab: 40 };
