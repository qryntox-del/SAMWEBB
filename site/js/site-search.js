// Public search is navigation only — never a substitute for real admin authentication.
const quickLinks = [
  ['Work', '/work.html'],
  ['Services', '/index.html#services'],
  ['About', '/index.html#about'],
  ['Contact', '/index.html#contact'],
];
function initSiteSearch() {
  const nav = document.querySelector('.site-header .nav');
  if (!nav || document.querySelector('.search-trigger')) return false;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'search-trigger';
  btn.setAttribute('aria-label', 'Search this website');
  btn.setAttribute('title', 'Search');
  btn.innerHTML = '<span aria-hidden="true">⌕</span>';
  const cta = nav.querySelector('.nav-cta');
  nav.insertBefore(btn, cta || nav.querySelector('.menu-button'));
  const overlay = document.createElement('div');
  overlay.className = 'site-search-backdrop';
  overlay.hidden = true;
  overlay.innerHTML = `<div class="site-search-panel" role="dialog" aria-modal="true" aria-label="Website search">
    <div class="search-panel-top"><b>Where would you like to go?</b><button class="site-search-close" type="button" aria-label="Close search">×</button></div>
    <form class="site-search-form" role="search"><input class="site-search-input" type="search" placeholder="Search pages or projects..." aria-label="Search this website" autocomplete="off"></form>
    <div class="search-results">${quickLinks.map(([name,href])=>`<a href="${href}">${name} ↗</a>`).join('')}</div>
    <p class="search-hint" role="status">Search for work, services, about or contact.</p>
  </div>`;
  document.body.append(overlay);
  const input = overlay.querySelector('.site-search-input');
  const hint = overlay.querySelector('.search-hint');
  const close = () => { overlay.hidden = true; document.body.style.overflow = ''; btn.focus(); };
  const open = () => { overlay.hidden = false; document.body.style.overflow = 'hidden'; input.value = ''; hint.textContent = 'Search for work, services, about or contact.'; input.focus(); };
  btn.addEventListener('click', open);
  overlay.querySelector('.site-search-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
  window.addEventListener('keydown', e => { if(e.key === 'Escape' && !overlay.hidden) close(); });
  overlay.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim().toLowerCase();
    if(q === 'sam') { location.assign('/admin.html'); return; }
    const matched = quickLinks.find(([name]) => q && (name.toLowerCase().includes(q) || q.includes(name.toLowerCase())));
    if(matched) { location.assign(matched[1]); return; }
    hint.textContent = q ? 'No matching page. Try “work”, “about”, “services” or “contact”.' : 'Type a page name to search.';
  });
  input.addEventListener('input', () => {hint.textContent = input.value.trim().toLowerCase() === 'sam' ? 'Press Enter to open the owner sign-in page.' : 'Press Enter to open a matching page.';});
  return true;
}
if(!initSiteSearch()) {
  const observer = new MutationObserver(() => {if(initSiteSearch()) observer.disconnect();});
  observer.observe(document.getElementById('site-header') || document.body,{subtree:true,childList:true});
}
