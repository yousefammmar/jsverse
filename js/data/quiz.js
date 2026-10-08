export const QUIZ = [
  ['What does typeof null return?', ['"null"', '"object"', '"undefined"', '"number"'], 1],
  ['Which method adds an item to the end of an array?', ['shift()', 'unshift()', 'push()', 'pop()'], 2],
  ['Which statement is correct for Google Tag Manager?', ['dataLayer.add(x)', 'window.dataLayer.push(x)', 'dataLayer = x', 'window.push(dataLayer)'], 1],
  ['What is "5" + 3 ?', ['8', '"53"', 'NaN', 'Error'], 1],
  ['Which keyword declares a block-scoped constant?', ['var', 'let', 'const', 'static'], 2],
  ['Which does NOT change the original array?', ['push', 'splice', 'map', 'sort'], 2]
];
export const KATAS = [
  { id: 'sum', title: 'sum(a, b)', brief: 'Write a function <code>sum(a, b)</code> that returns the total of two numbers.', fn: 'sum',
    start: 'function sum(a, b) {\n  // your code\n}', tests: [[[1, 2], 3], [[-5, 5], 0], [[0.5, 0.25], 0.75]] },
  { id: 'reverse', title: 'reverse(str)', brief: 'Write <code>reverse(str)</code> that returns the string backwards.', fn: 'reverse',
    start: 'function reverse(str) {\n  // your code\n}', tests: [[['abc'], 'cba'], [[''], ''], [['JSVERSE'], 'ESREVSJ']] },
  { id: 'evens', title: 'evens(arr)', brief: 'Write <code>evens(arr)</code> that returns only the even numbers.', fn: 'evens',
    start: 'function evens(arr) {\n  // your code\n}', tests: [[[[1, 2, 3, 4]], [2, 4]], [[[]], []], [[[7, 9]], []]] }
];
