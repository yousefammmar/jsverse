// Visualizer registry. Each exhibit lives in its own module exporting mount(el, { compact }).
const E = (id, title, blurb, icon, color) => ({ id, title, blurb, icon, color, load: () => import(`./${id}.js`) });
export const VIZ = [
  E('variables', 'Memory Cards', 'Declare, reassign and compare let and const. See the real TypeError when a constant fights back.', 'box', 'var(--mint)'),
  E('datatypes', 'Type Inspector', 'Type any value or expression and see its typeof, conversions and truthiness. Collect the famous gotchas.', 'shapes', 'var(--violet)'),
  E('arrays', 'Array Blocks', 'Push, pop, shift and unshift numbered blocks. Every method shows its return value.', 'list', 'var(--js)'),
  E('objects', 'Object Explorer', 'Walk a tree of properties, edit values and read the dot-path and JSON of whatever you select.', 'cube', 'var(--coral)'),
  E('conditions', 'Decision Flowchart', 'Change the inputs and watch the branch that really runs light up. Then compare === with ==.', 'branch', 'var(--aqua)'),
  E('loops', 'Loop Stepper', 'Step through for and for...of one phase at a time: start, test, body, step.', 'reset', 'var(--mint)'),
  E('functions', 'Function Machine', 'Feed arguments in, watch the body run, and catch the return value (or undefined) coming out.', 'func', 'var(--violet)'),
  E('dom', 'DOM Inspector', 'Select nodes in a live tree, get the selector that finds them, then add children and edit text.', 'tree', 'var(--coral)'),
  E('events', 'Event Propagation', 'Click a button and follow the event through capture, target and bubble with real listeners.', 'mouse', 'var(--js)'),
  E('json', 'JSON Explorer', 'Turn an object into JSON and back with the real JSON methods. Find out what gets lost on the way.', 'braces', 'var(--aqua)'),
  E('datalayer', 'dataLayer Stream', 'Click a mini shop and watch events travel into a validated tracking stream (a simulation).', 'database', 'var(--mint)')
];
export async function mountViz(id, el, { compact = false } = {}) {
  const v = VIZ.find(x => x.id === id);
  if (!v) throw new Error('Unknown visualizer: ' + id);
  const mod = await v.load();
  return mod.mount(el, { compact });
}
