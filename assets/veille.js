(function () {
  'use strict';
  const topics = { supervision: 'Supervision', automatisation: 'Automatisation', risques: 'Risques' };
  function validArticle(a) {
    if (!a || typeof a !== 'object') return false;
    try {
      const url = new URL(a.url);
      if (url.protocol !== 'https:' || url.hostname !== 'blogs.cisco.com' || url.username || url.password || url.port || !url.pathname.startsWith('/networking/')) return false;
    } catch (_) { return false; }
    for (const [key, limit] of Object.entries({id: 40, title: 200, summary: 1200, sisr: 650, limits: 650, source: 100, source_title: 250, model: 100})) {
      if (typeof a[key] !== 'string' || !a[key].trim() || a[key].length > limit) return false;
    }
    return Object.hasOwn(topics, a.topic) && Array.isArray(a.key_points) && a.key_points.length >= 1 && a.key_points.length <= 3 &&
      a.key_points.every(p => typeof p === 'string' && p.trim() && p.length <= 400) &&
      ['published_at', 'generated_at'].every(k => typeof a[k] === 'string' && Number.isFinite(Date.parse(a[k])));
  }
  if (typeof module !== 'undefined') module.exports = { validArticle };
  if (typeof document === 'undefined') return;
  const root = document.getElementById('watch-feed');
  if (!root) return;
  const list = document.getElementById('watch-list');
  const reader = document.getElementById('watch-reader');
  const status = document.getElementById('watch-status');
  const refresh = document.getElementById('watch-refresh');
  const search = document.getElementById('watch-search');
  const count = document.getElementById('watch-count');
  let articles = [], filter = 'all', selected = null, busy = false, loaded = false;
  const date = value => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function placeholder(message) {
    reader.replaceChildren(el('span', 'SYNTHÈSE / IA & RÉSEAUX', 'kicker-v2'), el('h3', message),
      el('p', 'Les fiches associent un résumé, trois points clés, une piste SISR et les limites de la source.'));
  }
  function openArticle(article, focus = false) {
    selected = article.id;
    reader.replaceChildren();
    reader.append(el('span', topics[article.topic] + ' / SYNTHÈSE IA', 'kicker-v2'));
    const title = el('h3', article.title);
    title.tabIndex = -1;
    reader.append(title, el('p', article.summary, 'watch-summary'));
    const points = el('ul', undefined, 'list-v2');
    article.key_points.forEach(point => points.append(el('li', point)));
    reader.append(el('h4', 'À retenir'), points, el('h4', 'Une piste pour le SISR'), el('p', article.sisr),
      el('h4', 'Limites et recul critique'), el('p', article.limits));
    const link = el('a', 'Lire l’article original ↗', 'text-link-v2');
    link.href = article.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    reader.append(link, el('p', 'Titre original : ' + article.source_title, 'muted-v2'),
      el('p', 'Publié le ' + date(article.published_at) + ' · Résumé généré le ' + date(article.generated_at), 'muted-v2'),
      el('p', 'Synthèse générée par IA, à vérifier avec la source. Elle ne remplace pas mon analyse personnelle.' +
        (article.truncated ? ' Le résumé porte sur un extrait limité de l’article.' : ''), 'watch-disclaimer'));
    list.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.article === selected)));
    if (focus) title.focus();
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase('fr');
    const shown = articles.filter(a => (filter === 'all' || a.topic === filter) &&
      (a.title + ' ' + a.summary + ' ' + a.source).toLocaleLowerCase('fr').includes(query));
    list.replaceChildren();
    count.textContent = shown.length + (shown.length === 1 ? ' synthèse affichée' : ' synthèses affichées');
    if (!shown.length) {
      list.append(el('p', articles.length ? 'Aucun article ne correspond à ce filtre.' : 'Les premières synthèses apparaîtront ici après activation du flux.', 'watch-empty'));
      selected = null;
      placeholder(articles.length ? 'Essaie un autre filtre.' : 'Le carnet attend ses premières lectures.');
      return;
    }
    shown.forEach(article => {
      const card = el('article', undefined, 'watch-card');
      card.append(el('span', topics[article.topic] + ' · ' + date(article.published_at), 'kicker-v2'),
        el('h3', article.title), el('p', article.source));
      const button = el('button', 'Lire le résumé ↗', 'watch-read');
      button.type = 'button'; button.dataset.article = article.id;
      button.setAttribute('aria-controls', 'watch-reader');
      button.setAttribute('aria-pressed', String(selected === article.id));
      button.setAttribute('aria-label', 'Lire le résumé : ' + article.title);
      button.addEventListener('click', () => openArticle(article, true));
      card.append(button); list.append(card);
    });
    openArticle(shown.find(a => a.id === selected) || shown[0]);
  }
  async function load() {
    if (busy) return;
    busy = true; refresh.disabled = true; root.setAttribute('aria-busy', 'true');
    status.textContent = 'Chargement des synthèses publiées…';
    try {
      const response = await fetch('data/veille.json', {cache: 'no-store', signal: AbortSignal.timeout(12000), credentials: 'omit'});
      if (!response.ok) throw new Error('HTTP');
      const raw = await response.text();
      if (raw.length > 400000) throw new Error('size');
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.articles) || data.articles.length > 30 || !data.articles.every(validArticle)) throw new Error('format');
      articles = data.articles;
      loaded = true;
      render();
      const checked = data.checked_at && Number.isFinite(Date.parse(data.checked_at)) ? ' · Dernière recherche : ' + date(data.checked_at) : '';
      status.textContent = articles.length ? 'Synthèses publiées chargées' + checked + (data.status === 'partial' ? ' · Certains articles n’ont pas pu être traités.' : '') :
        data.status === 'pending' ? 'Première génération en attente d’activation.' : 'Aucune synthèse publiée pour le moment.' + checked;
    } catch (_) {
      status.textContent = 'Impossible de charger le flux. Réessaie dans un instant.' + (articles.length ? ' Les fiches déjà chargées restent disponibles.' : ' Le carnet de sources reste consultable plus bas.');
      if (!loaded) placeholder('Le flux est momentanément indisponible.');
    } finally {
      busy = false; refresh.disabled = false; root.setAttribute('aria-busy', 'false');
    }
  }
  refresh.addEventListener('click', load);
  search.addEventListener('input', render);
  root.querySelectorAll('[data-watch-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.watchFilter;
    root.querySelectorAll('[data-watch-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render();
  }));
  const lazyLoad = () => { if (location.hash === '#p-veille' && !loaded) load(); };
  window.addEventListener('hashchange', lazyLoad);
  lazyLoad();
})();
