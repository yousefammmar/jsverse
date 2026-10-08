// Lesson content. Add an object to extend the curriculum; every page picks it up automatically.
// Each lesson: question (real-world hook) -> summary/body (concept) -> viz (visual demo) -> code (working example) -> mistakes
//              -> challenge (practice, an id from data/challenges.js) -> quiz (checkpoint) -> reward.
// `phase` is the region number (kept under the old name for compatibility). Resource links were checked on 2026-10-08.
const MDN = 'MDN', JI = 'javascript.info', GD = 'Google Developers', WD = 'web.dev', TH = 'Tag Manager Help', CD = 'Chrome DevTools';
const M = 'https://developer.mozilla.org/en-US/docs/';

export const REGIONS = [
  { id: 1, key: 'foundations', title: 'The Foundations', tagline: 'Building blocks of every program.', color: 'mint', glyph: 'cube' },
  { id: 2, key: 'browser', title: 'The Browser World', tagline: 'Make web pages react.', color: 'aqua', glyph: 'globe' },
  { id: 3, key: 'data', title: 'The Data Dimension', tagline: 'Objects, events and structured data.', color: 'violet', glyph: 'database' },
  { id: 4, key: 'tracking', title: 'The Tracking Universe', tagline: 'Measure what users do.', color: 'js', glyph: 'radar' }
];
export const PHASES = REGIONS;     // old name

export const LESSONS = [
  /* ============ REGION 1: THE FOUNDATIONS ============ */
  { id: 'variables', phase: 1, skill: 'variables', title: 'Variables & Types', min: 6, viz: 'variables', challenge: 'swap',
    question: 'How does an app remember your name between two screens?',
    summary: 'Name a value, know what kind of value it is, and understand why that matters.',
    learn: ['Declare values with const and let, and why var is avoided', 'Name the primitive types and check them with typeof', 'Predict what happens when strings and numbers mix'],
    body: `<p>A variable is a named box for a value. Use <code>const</code> by default, because most values never change, and <code>let</code> when you must reassign. <code>var</code> is the older keyword with confusing function-wide scope, so new code avoids it.</p>
    <p>Every value has a type. The primitives are <code>string</code>, <code>number</code>, <code>boolean</code>, <code>null</code>, <code>undefined</code>, <code>bigint</code> and <code>symbol</code>. Everything else is an object. JavaScript is <em>dynamically typed</em>: the variable has no type, the value does, so <code>typeof</code> reports on the value.</p>
    <p>Mixing types triggers <em>coercion</em>. The <code>+</code> operator joins text if either side is a string (<code>"5" + 3</code> is <code>"53"</code>), while <code>-</code> always does maths (<code>"5" - 3</code> is <code>2</code>).</p>
    <p class="tip">Gotcha: <code>typeof null</code> is <code>"object"</code>. It is a historical bug kept for compatibility. Test for null with <code>value === null</code>.</p>`,
    mistakes: ['Reassigning a <code>const</code> throws a TypeError. Switch to <code>let</code> only if the value truly changes.', 'Forgetting that form input values are strings, so <code>"2" + "2"</code> is <code>"22"</code>.'],
    code: `const name = "Ada";\nlet score = 10;\nscore = score + 5;\nconsole.log(name, score);\nconsole.log(typeof name, typeof score, typeof null);\nconsole.log("5" + 3, "5" - 3);`,
    quiz: [['Which keyword should you reach for first?', ['var', 'let', 'const', 'static'], 2, 'const signals "this binding never changes", which makes code easier to reason about. Use let only when you must reassign.'], ['What does "5" + 3 produce?', ['8', '"53"', 'NaN', 'an error'], 1, 'With a string on one side, + joins text instead of adding numbers.']],
    reward: 'Variables unlocked. You can now name things, which is half of programming.',
    resources: [{ s: MDN, t: 'Storing the information you need: variables', u: M + 'Learn_web_development/Core/Scripting/Variables' }, { s: JI, t: 'Variables', u: 'https://javascript.info/variables' }, { s: JI, t: 'Data types', u: 'https://javascript.info/types' }, { s: MDN, t: 'typeof reference', u: M + 'Web/JavaScript/Reference/Operators/typeof' }] },

  { id: 'datatypes', phase: 1, skill: 'datatypes', title: 'Data Types & Conversion', min: 7, viz: 'datatypes', challenge: 'typename',
    question: 'Why does a form that says age 30 add up to "301" instead of 31?',
    summary: 'Know exactly what type you hold, and convert it on purpose instead of by accident.',
    learn: ['Tell strings, numbers, booleans, null and undefined apart', 'Convert with Number(), String() and Boolean()', 'Recognise truthy and falsy values'],
    body: `<p>Seven primitive types plus objects cover everything in JavaScript. Knowing which one you hold is the difference between <code>31</code> and <code>"301"</code>.</p>
    <p>Convert deliberately: <code>Number("42")</code> gives <code>42</code>, <code>Number("abc")</code> gives <code>NaN</code> (not a number), <code>String(7)</code> gives <code>"7"</code>, and <code>Boolean(value)</code> tells you if a value is truthy. The falsy values are <code>false</code>, <code>0</code>, <code>""</code>, <code>null</code>, <code>undefined</code> and <code>NaN</code>; everything else is truthy, including <code>"0"</code> and <code>[]</code>.</p>
    <p class="tip">Use the Type Inspector in the Visualizers to type any value and see its type, <code>typeof</code> result and conversions side by side.</p>`,
    mistakes: ['Checking a number with <code>if (value)</code>: <code>0</code> is falsy but a perfectly valid number.', 'Comparing <code>NaN === NaN</code>. It is false. Use <code>Number.isNaN(x)</code>.'],
    code: `const values = [42, "42", true, null, undefined, [1, 2], { a: 1 }, 10n];\nfor (const v of values) console.log(String(v).padEnd(10), "->", typeof v);\nconsole.log(Number("42") + 1, "42" + 1, "42" - 1);\nconsole.log(Number("abc"), Boolean(""), Boolean("0"), String(123));`,
    quiz: [['What is Number("abc")?', ['0', 'undefined', 'NaN', 'an error'], 2, 'Number() returns NaN when the text is not a valid number. It does not throw.'], ['Which value is truthy?', ['0', '""', 'null', '"0"'], 3, 'Any non-empty string is truthy, even the text "0".']],
    reward: 'Types decoded. Fewer surprise strings in your future.',
    resources: [{ s: MDN, t: 'JavaScript data types and data structures', u: M + 'Web/JavaScript/Guide/Data_structures' }, { s: JI, t: 'Type conversions', u: 'https://javascript.info/type-conversions' }, { s: MDN, t: 'typeof reference', u: M + 'Web/JavaScript/Reference/Operators/typeof' }] },

  { id: 'conditions', phase: 1, skill: 'conditions', title: 'Conditions', min: 5, viz: 'conditions', challenge: 'grade',
    question: 'How does a site decide whether to show "Log in" or "Welcome back"?',
    summary: 'Make the program choose a path, and compare values without surprises.',
    learn: ['Write if / else if / else and the ternary operator', 'Prefer === over == and say why', 'List the falsy values'],
    body: `<p><code>if / else</code> runs different code depending on a condition. When you have several branches chain them with <code>else if</code>; for a simple two-way pick the ternary <code>condition ? a : b</code> is shorter.</p>
    <p>Comparison matters. <code>==</code> converts types before comparing, so <code>0 == ""</code> is <code>true</code>. <code>===</code> never converts, so <code>0 === ""</code> is <code>false</code>. Use <code>===</code> unless you have a reason not to.</p>
    <p>Conditions accept any value, which JavaScript treats as <em>truthy</em> or <em>falsy</em>. The falsy values are <code>false</code>, <code>0</code>, <code>""</code>, <code>null</code>, <code>undefined</code> and <code>NaN</code>. Everything else, including <code>"0"</code> and <code>[]</code>, is truthy.</p>`,
    mistakes: ['Using <code>=</code> (assignment) instead of <code>===</code> inside the parentheses.', 'Treating <code>0</code> as "missing". <code>if (count)</code> is false when count is 0.'],
    code: `const age = 20;\nif (age >= 18) {\n  console.log("adult");\n} else {\n  console.log("minor");\n}\nconsole.log(0 == "", 0 === "");\nconsole.log(age >= 18 ? "can vote" : "too young");`,
    quiz: [['What is 0 === ""?', ['true', 'false', 'undefined', 'an error'], 1, '=== never converts types, so a number and a string are never strictly equal.'], ['Which is the ternary operator?', ['a ?? b', 'a ? b : c', 'a => b', 'a || b'], 1, 'The ternary picks between two values: condition ? ifTrue : ifFalse.']],
    reward: 'Conditions unlocked. Your code can now make decisions.',
    resources: [{ s: MDN, t: 'Making decisions in your code: conditionals', u: M + 'Learn_web_development/Core/Scripting/Conditionals' }, { s: JI, t: 'Conditional branching: if, ?', u: 'https://javascript.info/ifelse' }, { s: MDN, t: 'Equality comparisons and sameness', u: M + 'Web/JavaScript/Guide/Equality_comparisons_and_sameness' }] },

  { id: 'loops', phase: 1, skill: 'conditions', title: 'Loops', min: 6, viz: 'loops', challenge: 'count-to',
    question: 'How does a store show 200 products without 200 lines of code?',
    summary: 'Repeat work without copy-pasting, and stop at the right moment.',
    learn: ['Choose between for, for...of and while', 'Read a loop header: start, test, step', 'Avoid off-by-one and infinite loops'],
    body: `<p>A loop repeats a block. Use <code>for</code> when you know how many times, <code>for...of</code> to walk the items of an array, and <code>while</code> when you repeat until something becomes true.</p>
    <p>A classic <code>for</code> header has three parts: <code>let i = 0</code> (start), <code>i &lt; 3</code> (keep going while true) and <code>i++</code> (step after each round). <code>break</code> leaves the loop early and <code>continue</code> skips to the next round.</p>
    <p class="tip">Try the Loop visualizer to step through the header one iteration at a time.</p>`,
    mistakes: ['Off-by-one: <code>i &lt;= arr.length</code> runs one step past the last item.', 'A <code>while</code> loop that never changes its condition runs forever and freezes the tab. The playground stops it for you.'],
    code: `for (let i = 1; i <= 3; i++) console.log("round", i);\nconst fruits = ["apple", "kiwi"];\nfor (const f of fruits) console.log(f.toUpperCase());\nlet n = 3;\nwhile (n > 0) { console.log(n--); }`,
    quiz: [['How many times does for (let i = 0; i < 3; i++) run?', ['2', '3', '4', 'forever'], 1, 'i takes the values 0, 1 and 2, so the body runs three times.'], ['Which loop walks the items of an array most directly?', ['while', 'for...of', 'do...while', 'switch'], 1, 'for...of hands you each item without managing an index.']],
    reward: 'Loops mastered. Repetition is now someone else’s job: the computer’s.',
    resources: [{ s: MDN, t: 'Looping code', u: M + 'Learn_web_development/Core/Scripting/Loops' }, { s: JI, t: 'Loops: while and for', u: 'https://javascript.info/while-for' }, { s: MDN, t: 'for...of reference', u: M + 'Web/JavaScript/Reference/Statements/for...of' }] },

  { id: 'arrays', phase: 1, skill: 'arrays', title: 'Arrays & Methods', min: 8, viz: 'arrays', challenge: 'evens',
    question: 'How does a playlist keep songs in order and let you add or skip one?',
    summary: 'Hold lists of data and transform them with map, filter and reduce.',
    learn: ['Add and remove items with push, pop, shift and unshift', 'Transform lists with map, filter and reduce', 'Know which methods mutate the original array'],
    body: `<p>An array is an ordered list, indexed from <code>0</code>. <code>push</code>/<code>pop</code> work on the end, <code>unshift</code>/<code>shift</code> on the start, and <code>arr.at(-1)</code> reads the last item.</p>
    <p>The three workhorse methods return <em>new</em> values and leave the original alone: <code>map</code> transforms every item, <code>filter</code> keeps items that pass a test, <code>reduce</code> folds the list into one value (a sum, an object, a count).</p>
    <p class="tip">Mutating methods: <code>push pop shift unshift splice sort reverse</code>. Non-mutating: <code>map filter slice concat</code>.</p>`,
    mistakes: ['Expecting <code>sort()</code> to sort numbers numerically. By default it sorts as strings: pass <code>(a, b) =&gt; a - b</code>.', 'Forgetting the starting value in <code>reduce</code>, which breaks on empty arrays.'],
    code: `const nums = [1, 2, 3, 4, 5];\nconsole.log(nums.map(n => n * n));\nconsole.log(nums.filter(n => n % 2));\nconsole.log(nums.reduce((s, n) => s + n, 0));\nconsole.log(nums.includes(3), nums.at(-1));`,
    quiz: [['Which method removes the LAST item?', ['shift', 'pop', 'slice', 'filter'], 1, 'pop removes and returns the last item. shift works on the first.'], ['Does map change the original array?', ['Yes', 'No, it returns a new array', 'Only for numbers', 'Only if you reassign'], 1, 'map never mutates. It builds and returns a fresh array.']],
    reward: 'Array Adventurer. Lists are now your playground.',
    resources: [{ s: MDN, t: 'Arrays', u: M + 'Learn_web_development/Core/Scripting/Arrays' }, { s: JI, t: 'Array methods', u: 'https://javascript.info/array-methods' }, { s: MDN, t: 'Array reference', u: M + 'Web/JavaScript/Reference/Global_Objects/Array' }] },

  { id: 'objects', phase: 1, skill: 'objects', title: 'Objects & JSON', min: 8, viz: 'objects', challenge: 'merge-user',
    question: 'How does an app keep a user’s name, email and settings together?',
    summary: 'Group related data, unpack it neatly and send it as text.',
    learn: ['Create objects and read nested values', 'Use destructuring and the spread operator', 'Convert with JSON.stringify and JSON.parse'],
    body: `<p>An object stores related data as <code>key: value</code> pairs, and it can hold other objects and arrays. <em>Destructuring</em> pulls fields into variables in one line, and the <em>spread</em> operator <code>{ ...user }</code> makes a shallow copy you can change safely.</p>
    <p>JSON is a text format that looks like an object literal. <code>JSON.stringify</code> turns a value into text for storage or the network, <code>JSON.parse</code> turns it back. JSON allows only double-quoted keys and no functions or <code>undefined</code>. This is the exact format of dataLayer payloads and API responses.</p>`,
    mistakes: ['Spread copies are <em>shallow</em>: nested objects are still shared with the original.', '<code>JSON.parse</code> throws on invalid text. Wrap it in <code>try / catch</code> for outside data.'],
    code: `const user = { name: "Sam", tags: ["js", "web"], address: { city: "Amman" } };\nconst { name, address: { city } } = user;\nconsole.log(name, city);\nconst copy = { ...user, name: "Alex" };\nconst text = JSON.stringify(copy);\nconsole.log(text);\nconsole.log(JSON.parse(text).tags);`,
    quiz: [['How do you read a nested value safely?', ['user.address.city', 'user["address"]["city"] only', 'city(user)', 'user->city'], 0, 'Dot access chains through nested objects. Add ?. when a level might be missing.'], ['What does { ...a, x: 1 } do?', ['Mutates a', 'Copies a and sets x', 'Deletes x', 'Throws'], 1, 'Spread copies the properties into a new object, then x overrides.']],
    reward: 'Object Architect. You can now model anything.',
    resources: [{ s: MDN, t: 'Object basics', u: M + 'Learn_web_development/Core/Scripting/Object_basics' }, { s: MDN, t: 'Working with JSON', u: M + 'Learn_web_development/Core/Scripting/JSON' }, { s: JI, t: 'Destructuring assignment', u: 'https://javascript.info/destructuring-assignment' }, { s: JI, t: 'Objects', u: 'https://javascript.info/object' }] },

  { id: 'functions', phase: 1, skill: 'functions', title: 'Functions & Scope', min: 8, viz: 'functions', challenge: 'sum',
    question: 'How can one button, written once, work on every product page?',
    summary: 'Package logic into reusable pieces and understand where variables live.',
    learn: ['Declare functions and arrow functions', 'Explain block and function scope', 'Describe a closure with a working example'],
    body: `<p>A function packages work you can call again with different inputs. Inputs are <em>parameters</em>, the output is the <em>return value</em>. Functions without <code>return</code> give back <code>undefined</code>. Arrow functions (<code>n =&gt; n * 2</code>) are short and common in callbacks.</p>
    <p><em>Scope</em> decides where a name is visible: inside a block <code>{ }</code> for <code>let</code>/<code>const</code>, and inside a function for everything declared in it. Inner code can read outer variables, not the other way round.</p>
    <p>A <em>closure</em> is a function that remembers the variables around it even after the outer function has finished. In the example, <code>counter()</code> returns a function that keeps its own private <code>c</code>.</p>`,
    mistakes: ['Forgetting <code>return</code>, so the call gives <code>undefined</code>.', 'Calling <code>fn</code> instead of <code>fn()</code>: without the parentheses nothing runs.'],
    code: `function add(a, b) { return a + b; }\nconst double = n => n * 2;\nconsole.log(add(2, 3), double(21));\nfunction counter() {\n  let c = 0;\n  return () => ++c;\n}\nconst next = counter();\nnext(); console.log("closure:", next());`,
    quiz: [['What does a function return when it has no return statement?', ['null', '0', 'undefined', 'an error'], 2, 'Without return, a function gives back undefined.'], ['What is a closure?', ['A function that remembers its surrounding variables', 'A way to close the browser', 'A type of loop', 'A class'], 0, 'The inner function keeps access to the outer function’s variables after it finished.']],
    reward: 'Function Wizard. You just taught code to do your work. Iconic.',
    resources: [{ s: MDN, t: 'Functions: reusable blocks of code', u: M + 'Learn_web_development/Core/Scripting/Functions' }, { s: JI, t: 'Functions', u: 'https://javascript.info/function-basics' }, { s: JI, t: 'Variable scope, closure', u: 'https://javascript.info/closure' }, { s: MDN, t: 'Closures', u: M + 'Web/JavaScript/Closures' }] },

  /* ============ REGION 2: THE BROWSER WORLD ============ */
  { id: 'html', phase: 2, skill: 'dom', title: 'HTML: The Page Skeleton', min: 7, viz: 'dom', challenge: 'dom-heading',
    html: `<h1 id="title">Hello</h1>\n<p class="note">I am written in HTML.</p>\n<p class="note">Me too.</p>\n<button id="go">Click me</button>`,
    question: 'What is a web page made of before any JavaScript touches it?',
    summary: 'HTML describes the structure of a page as nested elements, and JavaScript can read every one of them.',
    learn: ['Read an element: tag, attributes and content', 'Understand nesting as a family tree', 'Select elements by id, class and tag'],
    body: `<p>HTML is a set of <em>elements</em> written as tags: <code>&lt;p class="note"&gt;Hello&lt;/p&gt;</code> is a paragraph element with a <code>class</code> attribute and some text content. Elements nest inside each other, so a page is a tree: <code>html</code> contains <code>head</code> and <code>body</code>, and <code>body</code> contains everything you see.</p>
    <p>JavaScript finds elements with selectors: <code>getElementById("title")</code> returns one element, <code>querySelector(".note")</code> returns the first match, and <code>querySelectorAll("p")</code> returns every match. Once you hold an element you can read <code>textContent</code> or change it.</p>
    <p class="tip">The HTML tab below holds the page. The JavaScript tab runs against it and the Preview tab shows the result.</p>`,
    mistakes: ['Selecting an element that is not on the page returns <code>null</code>, and then reading <code>.textContent</code> throws a TypeError.', 'IDs must be unique. Use classes when several elements share a style or behaviour.'],
    code: `const title = document.getElementById("title");\nconsole.log(title.tagName, "->", title.textContent);\nconsole.log(document.querySelectorAll(".note").length, "notes");\ndocument.querySelector(".note").textContent = "Changed by JavaScript";\nconsole.log(document.querySelector(".note").textContent);`,
    quiz: [['What does querySelector return when nothing matches?', ['undefined', 'null', 'an empty array', 'an error'], 1, 'No match gives null, so check before using the result.'], ['Which attribute should be unique on a page?', ['class', 'id', 'href', 'alt'], 1, 'An id identifies exactly one element.']],
    reward: 'You can now read a page like a developer.',
    resources: [{ s: MDN, t: 'HTML basics: syntax', u: M + 'Learn_web_development/Core/Structuring_content/Basic_HTML_syntax' }, { s: WD, t: 'Learn HTML', u: 'https://web.dev/learn/html' }, { s: MDN, t: 'HTML elements reference', u: M + 'Web/HTML/Reference/Elements' }, { s: MDN, t: 'document.querySelector', u: M + 'Web/API/Document/querySelector' }] },

  { id: 'dom', phase: 2, skill: 'dom', title: 'DOM & Events', min: 9, viz: 'dom', challenge: 'dom-button',
    html: `<ul id="list"></ul>\n<button id="add">Add item</button>`,
    question: 'How does clicking "Like" update a number without reloading the page?',
    summary: 'Read and change the page, and react when users interact.',
    learn: ['Explain the DOM as a tree of node objects', 'Create, select and change elements', 'Attach event listeners'],
    body: `<p>The browser turns your HTML into the <em>DOM</em>, a tree of objects you can read and change from JavaScript. <code>document.querySelector("#id")</code> finds an element, <code>createElement</code> makes one, <code>textContent</code> changes its text.</p>
    <p>An <em>event</em> is something that happens: a click, a key press, a form submit. <code>addEventListener("click", fn)</code> runs <code>fn</code> every time it happens. Tracking tools use exactly this: a click listener that pushes an event to the dataLayer.</p>
    <p class="tip">This example uses a detached button, created in memory, so it is safe to run inside the lesson page.</p>`,
    mistakes: ['Selecting an element before the page has loaded returns <code>null</code>. Run scripts at the end of <code>body</code> or use <code>defer</code>.', 'Using <code>innerHTML</code> with user text allows script injection. Use <code>textContent</code>.'],
    code: `const btn = document.createElement("button");\nbtn.textContent = "Click me";\nlet clicks = 0;\nbtn.addEventListener("click", () => {\n  clicks++;\n  btn.textContent = "Clicked " + clicks;\n});\nbtn.click(); btn.click();\nconsole.log(btn.textContent);`,
    quiz: [['What is the safest way to put user text on the page?', ['innerHTML', 'textContent', 'outerHTML', 'document.write'], 1, 'textContent treats the text as text, so it cannot inject markup.'], ['What does addEventListener do?', ['Runs a function now', 'Runs a function every time an event happens', 'Deletes an element', 'Loads a script'], 1, 'It registers a function to call each time the event fires.']],
    reward: 'DOM Detective. You can now change a live page.',
    resources: [{ s: MDN, t: 'DOM scripting introduction', u: M + 'Learn_web_development/Core/Scripting/DOM_scripting' }, { s: MDN, t: 'Introduction to events', u: M + 'Learn_web_development/Core/Scripting/Events' }, { s: JI, t: 'DOM tree', u: 'https://javascript.info/dom-nodes' }, { s: JI, t: 'Introduction to browser events', u: 'https://javascript.info/introduction-browser-events' }] },

  { id: 'events', phase: 2, skill: 'events', title: 'Events & Bubbling', min: 9, viz: 'events', challenge: 'click-counter',
    html: `<div id="outer"><div id="inner"><button id="btn">Click</button></div></div>`,
    question: 'You click one button. Why can the whole page hear it?',
    summary: 'Events travel up through the page, and that one idea powers event delegation and click tracking.',
    learn: ['Describe event bubbling from child to parent', 'Use event.target and event.currentTarget', 'Stop or delegate events deliberately'],
    body: `<p>When an event fires on an element it does not stay there. It <em>bubbles</em>: the listener on the element runs first, then its parent, then the parent’s parent, all the way up to <code>document</code>. In the example the button, the inner box and the outer box all hear one click.</p>
    <p><code>event.target</code> is the element that was actually clicked, <code>event.currentTarget</code> is the element whose listener is running. Because events bubble you can attach <em>one</em> listener to a parent and handle clicks for many children. That is <em>event delegation</em>, and tag managers use it to track clicks across a whole page.</p>
    <p class="tip">Open the Event Propagation visualizer to watch the click travel up the tree, and try <code>event.stopPropagation()</code> to stop it.</p>`,
    mistakes: ['Adding a listener to every list item instead of delegating to the list. It works, but it wastes memory and misses items added later.', 'Overusing <code>stopPropagation()</code>. It also hides the click from analytics listeners higher up.'],
    code: `const log = name => e => console.log(name, "| target:", e.target.id, "| currentTarget:", e.currentTarget.id);\ndocument.getElementById("btn").addEventListener("click", log("button"));\ndocument.getElementById("inner").addEventListener("click", log("inner"));\ndocument.getElementById("outer").addEventListener("click", log("outer"));\ndocument.getElementById("btn").click();`,
    quiz: [['In which order do the listeners run for a click on the button?', ['outer, inner, button', 'button, inner, outer', 'only the button', 'random'], 1, 'Bubbling goes from the target up to its ancestors.'], ['Which property is the element that was actually clicked?', ['event.currentTarget', 'event.target', 'event.parent', 'event.source'], 1, 'event.target is where the event started.']],
    reward: 'Event Hunter. Nothing escapes your listeners now.',
    resources: [{ s: MDN, t: 'Event bubbling', u: M + 'Learn_web_development/Core/Scripting/Event_bubbling' }, { s: JI, t: 'Bubbling and capturing', u: 'https://javascript.info/bubbling-and-capturing' }, { s: JI, t: 'Event delegation', u: 'https://javascript.info/event-delegation' }, { s: MDN, t: 'addEventListener', u: M + 'Web/API/EventTarget/addEventListener' }] },

  { id: 'html-values', phase: 2, skill: 'dom', title: 'Reading HTML Values', min: 7, viz: null, challenge: 'read-form',
    html: `<input id="name" value="Ada">\n<input id="age" type="number" value="30">\n<input id="agree" type="checkbox" checked>\n<select id="plan"><option value="free">Free</option><option value="pro" selected>Pro</option></select>\n<button id="go" data-sku="SKU1" data-price="9.5">Buy</button>`,
    question: 'A signup form says age 30. How do you get that 30 into your code, as a number?',
    summary: 'Pull values out of inputs, checkboxes, selects and data attributes, with the right type.',
    learn: ['Read .value, .checked and selected options', 'Convert text to numbers with Number()', 'Store extra data on elements with data-* attributes'],
    body: `<p>Form controls hold their state in properties. An input’s text is <code>input.value</code>, a checkbox is <code>input.checked</code> (a boolean), and a select’s choice is <code>select.value</code>. The important detail: <code>.value</code> is <em>always a string</em>, even for <code>type="number"</code>, so convert with <code>Number()</code> before doing maths.</p>
    <p>HTML also lets you attach your own data with <code>data-*</code> attributes. <code>&lt;button data-sku="SKU1"&gt;</code> becomes <code>button.dataset.sku</code> in JavaScript. This is how real shops hand product details to tracking code.</p>`,
    mistakes: ['Adding two input values without converting them: <code>"30" + "5"</code> is <code>"305"</code>.', 'Reading <code>checkbox.value</code> instead of <code>checkbox.checked</code>.'],
    code: `const name = document.getElementById("name").value;\nconst age = Number(document.getElementById("age").value);\nconst agree = document.getElementById("agree").checked;\nconst plan = document.getElementById("plan").value;\nconst btn = document.getElementById("go");\nconsole.log({ name, age, agree, plan });\nconsole.log(typeof age, btn.dataset.sku, Number(btn.dataset.price) * 2);`,
    quiz: [['What type is input.value for type="number"?', ['number', 'string', 'boolean', 'it depends'], 1, 'Browsers always give .value as a string. Convert it yourself.'], ['How do you read data-sku="A1" in JavaScript?', ['el.data("sku")', 'el.dataset.sku', 'el.sku', 'el.getData()'], 1, 'The dataset object maps data-* attributes to camelCase properties.']],
    reward: 'Form reader unlocked. User input is now just data.',
    resources: [{ s: MDN, t: 'The input element', u: M + 'Web/HTML/Reference/Elements/input' }, { s: JI, t: 'Form properties and methods', u: 'https://javascript.info/form-elements' }, { s: MDN, t: 'Using data attributes', u: M + 'Web/HTML/How_to/Use_data_attributes' }] },

  { id: 'async', phase: 2, skill: 'events', title: 'Async & Promises', min: 10, viz: null, challenge: 'wait-value',
    question: 'How does a page keep working while it waits for data from a server?',
    summary: 'Handle work that finishes later, like network calls and timers.',
    learn: ['Describe a Promise and its three states', 'Write async / await code that reads top to bottom', 'Know where fetch fits in'],
    body: `<p>Some work takes time: network requests, timers, file reads. JavaScript does not freeze the page waiting; it returns a <em>Promise</em>, an object that is <em>pending</em>, then either <em>fulfilled</em> with a value or <em>rejected</em> with an error.</p>
    <p><code>async</code> functions always return a promise, and <code>await</code> pauses <em>that function</em> until a promise settles, so the code reads in order. Real apps use <code>await fetch(url)</code>; here a timer stands in for the network. Wrap awaits in <code>try / catch</code> to handle failures.</p>`,
    mistakes: ['Forgetting <code>await</code>: you get a pending Promise instead of the data.', '<code>fetch</code> only rejects on network failure. A 404 still resolves, so check <code>response.ok</code>.'],
    code: `const wait = ms => new Promise(r => setTimeout(r, ms));\nasync function load() {\n  console.log("loading...");\n  await wait(500);\n  return { id: 1, title: "Hello" };\n}\nload().then(d => console.log("got", d));`,
    quiz: [['What does an async function always return?', ['undefined', 'a Promise', 'a string', 'nothing'], 1, 'Whatever you return is wrapped in a Promise.'], ['What does await do?', ['Blocks the whole page', 'Pauses that async function until the promise settles', 'Creates a thread', 'Retries on error'], 1, 'Only the async function pauses; the rest of the page stays responsive.']],
    reward: 'Async unlocked. Patience, but make it code.',
    resources: [{ s: MDN, t: 'Using promises', u: M + 'Web/JavaScript/Guide/Using_promises' }, { s: JI, t: 'Promise basics', u: 'https://javascript.info/promise-basics' }, { s: JI, t: 'Async / await', u: 'https://javascript.info/async-await' }, { s: MDN, t: 'Using the Fetch API', u: M + 'Web/API/Fetch_API/Using_Fetch' }] },

  /* ============ REGION 3: THE DATA DIMENSION ============ */
  { id: 'objects-events', phase: 3, skill: 'events', title: 'Objects Meet Events', min: 8, viz: 'events', challenge: 'event-object',
    question: 'What do you actually get when the user clicks something?',
    summary: 'An event is an object. Read it, and turn it into your own tidy data object.',
    learn: ['Inspect the event object and its useful properties', 'Combine event data and data-* attributes into a new object', 'Build structured payloads from user actions'],
    body: `<p>Every listener receives an <em>event object</em> with details about what happened: <code>type</code> (such as <code>"click"</code>), <code>target</code>, <code>currentTarget</code>, <code>timeStamp</code> and more. Keyboard events add <code>key</code>, mouse events add coordinates.</p>
    <p>The professional pattern is to read what you need and assemble <em>your own</em> plain object: <code>{ type, sku, price }</code>. That object is easy to log, test, and send as JSON, which is exactly how a tracking payload is made.</p>`,
    mistakes: ['Using <code>event.target</code> when a child element (an icon inside a button) was clicked. Prefer <code>currentTarget</code> or <code>target.closest("button")</code>.', 'Putting the whole event object in a payload. Pick only the plain values you need.'],
    code: `const btn = document.createElement("button");\nbtn.dataset.sku = "SKU1";\nbtn.dataset.price = "9.5";\nbtn.textContent = "Buy";\nbtn.addEventListener("click", event => {\n  const el = event.currentTarget;\n  const data = { type: event.type, sku: el.dataset.sku, price: Number(el.dataset.price) };\n  console.log(data);\n});\nbtn.click();`,
    quiz: [['Why build your own object from an event?', ['Events cannot be logged', 'It gives a small, clean, serialisable payload', 'It is faster to type', 'Browsers require it'], 1, 'A plain object of just the values you need is easy to inspect and send.'], ['Where do data-price="9.5" values come from in code?', ['el.price', 'el.dataset.price (a string)', 'el.getPrice()', 'event.price'], 1, 'dataset values are strings, so convert with Number().']],
    reward: 'Objects and events, together. Tracking code is within reach.',
    resources: [{ s: MDN, t: 'Event interface', u: M + 'Web/API/Event' }, { s: MDN, t: 'Event.target', u: M + 'Web/API/Event/target' }, { s: MDN, t: 'Using data attributes', u: M + 'Web/HTML/How_to/Use_data_attributes' }] },

  { id: 'json', phase: 3, skill: 'json', title: 'JSON In Depth', min: 8, viz: 'json', challenge: 'parse-safe',
    question: 'How do two programs, written in different languages, trade data?',
    summary: 'JSON is the universal text format for data. Learn to read it, write it and survive bad input.',
    learn: ['Convert objects to JSON text and back', 'Know what JSON cannot represent', 'Handle invalid JSON safely with try / catch'],
    body: `<p>JSON (JavaScript Object Notation) is plain text that describes data. <code>JSON.stringify(value)</code> produces text, <code>JSON.parse(text)</code> rebuilds the value. The format is strict: keys and strings use double quotes, and there are no comments or trailing commas.</p>
    <p>Not everything survives the trip. <code>undefined</code> and functions are dropped, and a <code>Date</code> becomes a string, so after parsing it is <em>not</em> a Date any more. Always wrap <code>JSON.parse</code> on outside data in <code>try / catch</code>, because a single stray character throws a SyntaxError.</p>
    <p class="tip">Use the JSON Explorer visualizer to turn an object into JSON text and back, and to see exactly which values change.</p>`,
    mistakes: ['Using single quotes: <code>{\'a\': 1}</code> is not valid JSON.', 'Assuming a parsed Date is still a Date. It comes back as a string.'],
    code: `const order = { id: 7, items: [{ sku: "SKU1", qty: 2 }], paid: true, note: undefined, when: new Date(0) };\nconst text = JSON.stringify(order);\nconsole.log(text);\nconst back = JSON.parse(text);\nconsole.log(back.items[0].sku, typeof back.when);\nconsole.log(JSON.stringify(order, null, 2));\ntry { JSON.parse("{ bad json }"); } catch (e) { console.log("Caught:", e.name); }`,
    quiz: [['What happens to undefined values in JSON.stringify of an object?', ['They become "undefined"', 'They are dropped', 'They become null', 'It throws'], 1, 'Object properties with undefined are omitted from the output.'], ['Which is valid JSON?', ["{'a': 1}", '{"a": 1}', '{a: 1}', '{"a": 1,}'], 1, 'Keys need double quotes, and trailing commas are not allowed.']],
    reward: 'JSON Ninja. Data in any language, no problem.',
    resources: [{ s: MDN, t: 'Working with JSON', u: M + 'Learn_web_development/Core/Scripting/JSON' }, { s: MDN, t: 'JSON.parse', u: M + 'Web/JavaScript/Reference/Global_Objects/JSON/parse' }, { s: JI, t: 'JSON methods', u: 'https://javascript.info/json' }, { s: JI, t: 'Error handling: try...catch', u: 'https://javascript.info/try-catch' }] },

  /* ============ REGION 4: THE TRACKING UNIVERSE ============ */
  { id: 'datalayer', phase: 4, skill: 'tracking', title: 'The dataLayer', min: 8, viz: 'datalayer', challenge: 'dl-push',
    question: 'How does a website tell Google Tag Manager that something just happened?',
    summary: 'The array that carries information from your page to Google Tag Manager.',
    learn: ['Explain what window.dataLayer is and who reads it', 'Push events and variables correctly', 'Avoid the overwrite and timing mistakes'],
    body: `<p>The dataLayer is a plain JavaScript array that Google Tag Manager (GTM) and gtag.js watch. Your page <code>push</code>es objects onto it; tags and triggers inside GTM react. The special key <code>event</code> names a moment, such as <code>"login"</code> or <code>"purchase"</code>, that a trigger can listen for. Other keys are variables available to your tags.</p>
    <p>Declare it above the GTM snippet with <code>window.dataLayer = window.dataLayer || []</code>, so early pushes are not lost. Pushing a key that already exists replaces the old value, and values last only for the current page view.</p>
    <p class="tip">Never write <code>dataLayer = [...]</code> after load. Reassigning replaces the array GTM is watching and breaks tracking. Always use <code>push</code>. A push alone does not send analytics: GTM still needs a tag and a trigger.</p>`,
    mistakes: ['Capitalisation: <code>datalayer</code> and <code>dataLayer</code> are different names.', 'Reassigning the array instead of pushing to it.', 'Pushing event names that differ between pages, such as <code>signup</code> and <code>sign_up</code>.'],
    code: `window.dataLayer = window.dataLayer || [];\nwindow.dataLayer.push({ event: "page_view", page_path: "/lessons" });\nwindow.dataLayer.push({ event: "cta_click", label: "Start lessons" });\nconsole.log("pushed events");`,
    quiz: [['How do you add an event to the dataLayer?', ['dataLayer = [event]', 'window.dataLayer.push({ event: "x" })', 'dataLayer.add("x")', 'window.event("x")'], 1, 'Always push objects onto the existing array.'], ['Does a push by itself send data to Google Analytics?', ['Yes, always', 'No, GTM needs a tag and trigger', 'Only on purchases', 'Only in Chrome'], 1, 'The dataLayer only holds data. Tags configured in GTM decide what is sent.']],
    reward: 'Tracking Engineer in training. The data layer is yours.',
    resources: [{ s: GD, t: 'The data layer', u: 'https://developers.google.com/tag-platform/tag-manager/datalayer' }, { s: GD, t: 'Tag Manager for web', u: 'https://developers.google.com/tag-platform/tag-manager/web' }, { s: GD, t: 'GA4 event reference', u: 'https://developers.google.com/analytics/devguides/collection/ga4/reference/events' }, { s: WD, t: 'Learn JavaScript', u: 'https://web.dev/learn/javascript' }] },

  { id: 'click-tracking', phase: 4, skill: 'tracking', title: 'Click & Form Tracking', min: 9, viz: 'datalayer', challenge: 'dl-click',
    html: `<button id="cta" data-track="cta_click" data-label="Start free">Start free</button>\n<a href="#" id="nav" data-track="nav_click" data-label="Pricing">Pricing</a>`,
    question: 'How does a team learn which button people actually click?',
    summary: 'Connect page interactions to dataLayer events with one delegated listener.',
    learn: ['Use data-* attributes to describe trackable elements', 'Delegate one listener to catch many clicks', 'Push consistent, well-named events'],
    body: `<p>The scalable way to track clicks is to mark elements in the HTML (<code>data-track="cta_click"</code>) and attach <em>one</em> listener near the top of the page. When a click bubbles up, <code>event.target.closest("[data-track]")</code> finds the nearest marked element, and you push an event built from its attributes.</p>
    <p>Keep names consistent and snake_case, send only what you need, and never put personal data (emails, names) in events. In real GTM you would then create a trigger for <code>cta_click</code> and a tag that reports it.</p>`,
    mistakes: ['Tracking by CSS class names that designers change later. Use dedicated <code>data-*</code> attributes.', 'Pushing the visible text only. Translated or edited text changes your reports, so send a stable id too.'],
    code: `window.dataLayer = window.dataLayer || [];\ndocument.addEventListener("click", event => {\n  const el = event.target.closest("[data-track]");\n  if (!el) return;\n  window.dataLayer.push({ event: el.dataset.track, label: el.dataset.label });\n});\ndocument.getElementById("cta").click();\nconsole.log("clicked the CTA");`,
    quiz: [['Why use one delegated listener for tracking?', ['It is required by GA4', 'It covers many elements, including ones added later', 'It is faster to read', 'It hides data from users'], 1, 'Events bubble, so a single listener on a parent handles every child.'], ['Which is a safer way to mark elements for tracking?', ['A CSS class like .blue-btn', 'A data-track attribute', 'The element’s position', 'The page colour'], 1, 'Dedicated attributes are stable when the design changes.']],
    reward: 'Click tracking mastered. Product teams will love you.',
    resources: [{ s: TH, t: 'About triggers', u: 'https://support.google.com/tagmanager/answer/7679316' }, { s: JI, t: 'Event delegation', u: 'https://javascript.info/event-delegation' }, { s: GD, t: 'The data layer', u: 'https://developers.google.com/tag-platform/tag-manager/datalayer' }, { s: GD, t: 'GA4 event reference', u: 'https://developers.google.com/analytics/devguides/collection/ga4/reference/events' }] },

  { id: 'ecommerce', phase: 4, skill: 'tracking', title: 'GA4 Ecommerce Events', min: 10, viz: 'datalayer', challenge: 'dl-add-to-cart',
    question: 'How does a shop know which products make money?',
    summary: 'Send product and purchase data in the exact shape GA4 expects.',
    learn: ['Build an items array with ids, names, prices and quantities', 'Clear the ecommerce object before each push', 'Make value, currency and transaction_id correct'],
    body: `<p>GA4 ecommerce events carry an <code>ecommerce</code> object with an <code>items</code> array. Each item has an <code>item_id</code> and/or <code>item_name</code>, a <code>price</code> and a <code>quantity</code>. Set <code>currency</code> whenever you send a <code>value</code>.</p>
    <p>Google's GTM guidance is to push <code>{ ecommerce: null }</code> before each ecommerce event, so values from the previous event do not carry over. For <code>purchase</code>, <code>transaction_id</code> is required, and <code>value</code> is the sum of <code>price × quantity</code> across items. <code>add_to_cart</code> and <code>begin_checkout</code> also take <code>currency</code>, <code>value</code> and <code>items</code>.</p>
    <p class="tip">Check your work in the Tracking Lab: it validates every event and tells you whether a rule is <em>required</em> by GA4 or only a recommended convention.</p>`,
    mistakes: ['A <code>value</code> that does not match the items total.', 'A missing or reused <code>transaction_id</code> on purchase, which makes GA4 count duplicate orders.', 'Skipping the <code>ecommerce: null</code> clear and leaking old items into the next event.'],
    code: `window.dataLayer = window.dataLayer || [];\nconst items = [{ item_id: "SKU1", item_name: "Notebook", price: 9.5, quantity: 2 }];\nwindow.dataLayer.push({ ecommerce: null });\nwindow.dataLayer.push({\n  event: "purchase",\n  ecommerce: {\n    transaction_id: "T-1001",\n    currency: "USD",\n    value: items.reduce((s, i) => s + i.price * i.quantity, 0),\n    items\n  }\n});`,
    quiz: [['Which field is required on a purchase event?', ['coupon', 'transaction_id', 'shipping', 'tax'], 1, 'GA4 identifies an order by transaction_id.'], ['How is purchase value calculated?', ['Any number', 'Sum of price × quantity', 'Number of items', 'Highest price'], 1, 'Google documents value as the sum of price times quantity for every item.']],
    reward: 'Ecommerce unlocked. You can now measure revenue like a pro.',
    resources: [{ s: GD, t: 'Measure ecommerce (GA4, GTM tab)', u: 'https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm' }, { s: GD, t: 'GA4 event reference', u: 'https://developers.google.com/analytics/devguides/collection/ga4/reference/events' }, { s: GD, t: 'The data layer', u: 'https://developers.google.com/tag-platform/tag-manager/datalayer' }] },

  { id: 'debugging', phase: 4, skill: 'debugging', title: 'Debugging Like a Pro', min: 9, viz: null, challenge: 'fix-sum',
    question: 'The total says NaN. Where do you even start?',
    summary: 'Read errors, print values, and shrink the problem until the bug has nowhere to hide.',
    learn: ['Read an error message and find the line', 'Use console.log to inspect real values', 'Debug tracking by checking what was actually pushed'],
    body: `<p>Debugging is a method, not luck. First <em>read the error</em>: the name (<code>ReferenceError</code>, <code>TypeError</code>, <code>SyntaxError</code>) tells you the kind of problem and the line number tells you where. If nothing throws but the result is wrong, <em>print the values</em> with <code>console.log</code> at each step until reality stops matching your expectation.</p>
    <p>For tracking bugs, check what was <em>actually pushed</em> (the Tracking Lab timeline shows every payload) before blaming GTM. In the editor below the total comes out as <code>NaN</code>. Find out why, then fix it.</p>`,
    mistakes: ['Changing code at random instead of forming a hypothesis and testing it.', 'Ignoring the first error. Later errors are often caused by it.'],
    code: `const prices = [10, 20, 30];\nlet total = 0;\nfor (let i = 0; i <= prices.length; i++) {\n  total += prices[i];\n}\nconsole.log("Total:", total);   // should be 60`,
    quiz: [['What does NaN usually tell you here?', ['The loop is fine', 'Maths happened with undefined or non-numbers', 'A syntax error', 'A missing semicolon'], 1, 'undefined + 10 is NaN, so a value was missing, here because the loop ran one step too far.'], ['What is the best first step when code misbehaves?', ['Rewrite everything', 'Read the error and print the values', 'Restart the computer', 'Delete the file'], 1, 'Evidence first. Guessing comes last.']],
    reward: 'Bug Slayer in the making. Errors are now just clues.',
    resources: [{ s: MDN, t: 'What went wrong? Troubleshooting JavaScript', u: M + 'Learn_web_development/Core/Scripting/What_went_wrong' }, { s: CD, t: 'Debug JavaScript', u: 'https://developer.chrome.com/docs/devtools/javascript' }, { s: JI, t: 'Debugging in the browser', u: 'https://javascript.info/debugging-chrome' }, { s: TH, t: 'Preview and debug containers', u: 'https://support.google.com/tagmanager/answer/6107056' }] }
];
export const lessonById = id => LESSONS.find(l => l.id === id);
export const lessonsInRegion = r => LESSONS.filter(l => l.phase === r);
