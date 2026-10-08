// Curated links, grouped by purpose. Lesson-specific links come from lessons.js automatically.
// All URLs were checked on 2026-10-08. Each entry: { s: source, t: title, d: why it helps, u: url }.
export const GROUPS = [
  { title: 'Learn JavaScript', blurb: 'Full courses and references to keep open while you study.', items: [
    { s: 'MDN', t: 'Learn web development', d: 'Beginner-friendly guides from the browser vendors themselves.', u: 'https://developer.mozilla.org/en-US/docs/Learn_web_development' },
    { s: 'javascript.info', t: 'The Modern JavaScript Tutorial', d: 'Clear, example-heavy chapters from basics to advanced topics.', u: 'https://javascript.info/' },
    { s: 'web.dev', t: 'Learn JavaScript', d: 'A structured course from the Chrome team.', u: 'https://web.dev/learn/javascript' },
    { s: 'freeCodeCamp', t: 'JavaScript curriculum', d: 'Free interactive exercises and projects.', u: 'https://www.freecodecamp.org/learn/javascript-v9/' },
    { s: 'Eloquent JavaScript', t: 'Read the book online', d: 'A free book that teaches programming through JavaScript.', u: 'https://eloquentjavascript.net/' },
    { s: 'GitHub', t: "You Don't Know JS", d: 'A deeper look at how the language really works.', u: 'https://github.com/getify/You-Dont-Know-JS' }
  ] },
  { title: 'References', blurb: 'Look things up when you need the exact behaviour.', items: [
    { s: 'MDN', t: 'JavaScript reference', d: 'Every built-in object, method and operator, with examples.', u: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference' },
    { s: 'W3Schools', t: 'JavaScript tutorial', d: 'Short pages with a try-it editor, handy for quick refreshers.', u: 'https://www.w3schools.com/js/' },
    { s: 'Chrome DevTools', t: 'Console overview', d: 'Read errors and inspect values while your code runs.', u: 'https://developer.chrome.com/docs/devtools/console' },
    { s: 'Chrome DevTools', t: 'DevTools documentation', d: 'Network, Elements, Sources and performance tools.', u: 'https://developer.chrome.com/docs/devtools' }
  ] },
  { title: 'Practice', blurb: 'Skills stick when you write code, so do something small every day.', items: [
    { s: 'Exercism', t: 'JavaScript track', d: 'Exercises with free mentoring and community solutions.', u: 'https://exercism.org/tracks/javascript' },
    { s: 'roadmap.sh', t: 'JavaScript developer roadmap', d: 'A visual map of what to learn next.', u: 'https://roadmap.sh/javascript' }
  ] },
  { title: 'Tag Manager & GA4', blurb: 'The official docs for the telemetry lessons.', items: [
    { s: 'Google Developers', t: 'The data layer', d: 'How window.dataLayer works, with pitfalls to avoid.', u: 'https://developers.google.com/tag-platform/tag-manager/datalayer' },
    { s: 'Google Developers', t: 'Measure ecommerce (GTM)', d: 'The exact event shapes the Tracking Lab validates against.', u: 'https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm' },
    { s: 'Google Developers', t: 'GA4 event reference', d: 'Recommended events and their parameters.', u: 'https://developers.google.com/analytics/devguides/collection/ga4/reference/events' },
    { s: 'Tag Manager Help', t: 'Introduction to Tag Manager', d: 'Containers, tags, triggers and variables explained.', u: 'https://support.google.com/tagmanager/answer/6102821' },
    { s: 'Google Developers', t: 'Server-side tagging', d: 'Move tag processing from the browser to your own server.', u: 'https://developers.google.com/tag-platform/tag-manager/server-side' }
  ] },
  { title: 'Debugging tools', blurb: 'Verify that your events really arrive.', items: [
    { s: 'Tag Manager Help', t: 'Preview and debug containers', d: 'See which tags fire on each dataLayer event.', u: 'https://support.google.com/tagmanager/answer/6107056' },
    { s: 'Analytics Help', t: 'Monitor events in DebugView', d: 'Watch GA4 events arrive in real time from a test device.', u: 'https://support.google.com/analytics/answer/7201382' },
    { s: 'Google', t: 'Tag Assistant', d: 'Debug Google tags and connect to a preview session.', u: 'https://tagassistant.google.com/' }
  ] }
];
