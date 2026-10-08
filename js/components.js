// Small markup helpers shared by pages.
export const pageHead = (chip, title, lead = '') =>
  `<div class="pagehead"><span class="chip">${chip}</span><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div>`;
