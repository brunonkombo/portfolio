const pages = [...document.querySelectorAll('.page')];
const links = [...document.querySelectorAll('[data-page]')];
const ham = document.getElementById('ham');
const sidebar = document.getElementById('sb');
const overlay = document.getElementById('overlay');
const mobile = window.matchMedia('(max-width: 768px)');
function menu(open) {
  sidebar.classList.toggle('open', open);
  overlay.classList.toggle('show', open);
  ham.classList.toggle('open', open);
  ham.setAttribute('aria-expanded', String(open));
  sidebar.inert = mobile.matches && !open;
}
mobile.addEventListener('change', () => menu(false));
function navigate(focus = false) {
  const id = location.hash.slice(1);
  const anchor = document.getElementById(id);
  const selected = pages.find(p => p.id === id) || anchor?.closest('.page') || pages[0];
  pages.forEach(p => { p.classList.toggle('on', p === selected); p.hidden = p !== selected; p.inert = p !== selected; });
  links.forEach(a => { const active = a.dataset.page === selected.id; a.classList.toggle('on', active); if (active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  document.getElementById('bread').textContent = 'PORTFOLIO / ' + (document.querySelector('.sb-nav [data-page="'+selected.id+'"] .sb-lbl')?.textContent || 'Accueil');
  menu(false);
  if (focus) { const target = anchor && anchor !== selected ? anchor : selected.querySelector('h1'); target.tabIndex = -1; target.focus({preventScroll:true}); if (target === anchor && anchor !== selected) target.scrollIntoView({block:'start'}); else selected.scrollTop = 0; }
}
window.addEventListener('hashchange', () => navigate(true));
links.forEach(a => a.addEventListener('click', () => { if (location.hash === a.getAttribute('href')) navigate(true); }));
ham.addEventListener('click', () => menu(!sidebar.classList.contains('open')));
overlay.addEventListener('click', () => menu(false));
document.addEventListener('keydown', e => { if(e.key === 'Escape') { menu(false); ham.focus(); } });
navigate();
