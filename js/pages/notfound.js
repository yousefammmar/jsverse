// 404: a JavaScript-themed dead end with clear ways back.
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { bitSvg } from '../bit.js';
mountLayout('404.html');
document.getElementById('main').innerHTML = `
<section class="page nf">
  <div class="nf-bit">${bitSvg('oops')}</div>
  <span class="eyebrow">Error 404</span>
  <h1>This page is <em class="hl">undefined.</em></h1>
  <p class="lead" style="margin-inline:auto">We looked everywhere, including inside the <code>node_modules</code> of our hearts. The page you wanted does not exist, or it moved without telling us.</p>
  <pre class="code-block nf-code" aria-label="Error output"><span class="t-com">// What the console says</span>
<span class="t-bi">Uncaught</span> <span class="t-fn">TypeError</span>: Cannot read properties of <span class="t-num">undefined</span> (reading <span class="t-str">'page'</span>)
    at <span class="t-fn">router</span> (<span class="t-str">${location.pathname}</span>)</pre>
  <div class="row" style="justify-content:center"><a class="btn p lg" href="/index.html">${ic('home')} Back to safety</a><a class="btn lg" href="/lessons.html">${ic('book')} Browse lessons</a><a class="btn lg" href="/bugs.html">${ic('bug')} Visit the Bug Museum</a></div>
</section>`;
