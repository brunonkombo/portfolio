'use strict';
function inspectLink(raw, expected = '') {
  const result = { error: '', facts: [], signals: [] };
  const value = raw.trim();
  if (!value || value.length > 2048) { result.error = 'Saisis une URL de 1 à 2 048 caractères.'; return result; }
  if (!/^https?:\/\//i.test(value) || /[\u0000-\u0020\u007f\\]/.test(value)) {
    result.error = 'Utilise une URL HTTP ou HTTPS complète, sans espace ni barre oblique inversée.'; return result;
  }
  let url;
  try { url = new URL(value); } catch { result.error = 'Cette adresse ne peut pas être interprétée comme une URL.'; return result; }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname) { result.error = 'Le nom d’hôte est manquant.'; return result; }
  result.facts = [['Protocole', url.protocol.replace(':', '').toUpperCase()], ['Véritable nom d’hôte', hostname], ['Port', url.port || (url.protocol === 'https:' ? '443 (par défaut)' : '80 (par défaut)')]];
  if (url.protocol === 'http:') result.signals.push('La connexion annoncée utilise HTTP, sans chiffrement TLS.');
  if (url.username || url.password) result.signals.push('Une partie avant @ correspond à des identifiants, pas au véritable site destinataire. Ne te fie pas à ce nom.');
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith('[')) result.signals.push('L’adresse utilise une IP plutôt qu’un nom de domaine. Cela peut être légitime, mais vérifie le destinataire.');
  if (hostname.split('.').some(part => part.startsWith('xn--'))) result.signals.push('Domaine internationalisé (Punycode) : vérifie attentivement les caractères et les ressemblances visuelles.');
  if (hostname.split('.').length > 3) result.signals.push('Le nom d’hôte comporte plusieurs niveaux. Un nom connu placé à gauche ne prouve pas l’identité du domaine.');
  if (url.port) result.signals.push('Un port non standard est indiqué. Vérifie qu’il correspond au service attendu.');
  if (['bit.ly', 't.co', 'tinyurl.com', 'is.gd', 'cutt.ly'].includes(hostname)) result.signals.push('Raccourcisseur connu : la destination finale n’est pas visible et n’a pas été suivie.');
  if (value.includes('%')) result.signals.push('L’adresse contient des caractères encodés. Ils peuvent être légitimes, mais compliquent sa lecture.');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || !hostname.includes('.')) result.signals.push('Nom local ou sans suffixe public : il peut désigner une ressource interne.');
  if (expected.trim()) {
    const domain = expected.trim();
    if (/[\s/:@?#\\]/.test(domain) || !domain.includes('.')) { result.error = 'Dans « Domaine attendu », saisis uniquement un domaine, par exemple exemple.fr.'; return result; }
    let normalized;
    try { normalized = new URL('https://' + domain).hostname.toLowerCase().replace(/\.$/, ''); } catch { result.error = 'Le domaine attendu n’est pas valide.'; return result; }
    if (!hostname.includes(':') && (hostname === normalized || hostname.endsWith('.' + normalized))) result.facts.push(['Comparaison', 'Correspond au domaine saisi ou à un sous-domaine. Cela ne prouve pas sa fiabilité.']);
    else result.signals.push('Le véritable nom d’hôte ne correspond pas au domaine attendu, ni à un de ses sous-domaines.');
  }
  return result;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { inspectLink };
if (typeof document !== 'undefined') {
  const form = document.getElementById('url-form');
  if (form) {
    const input = document.getElementById('url-input');
    const expected = document.getElementById('expected-host');
    const output = document.getElementById('url-result');
    const verdict = document.getElementById('url-verdict');
    const facts = document.getElementById('url-facts');
    const signals = document.getElementById('url-signals');
    function run() {
      const result = inspectLink(input.value, expected.value);
      output.hidden = false;
      facts.replaceChildren(); signals.replaceChildren();
      verdict.textContent = result.error || (result.signals.length ? result.signals.length + ' point(s) de vigilance à examiner.' : 'Aucun des signaux recherchés n’a été repéré. La sécurité du site reste inconnue.');
      if (!result.error) {
        result.facts.forEach(([label, value]) => { const dt = document.createElement('dt'); const dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value; facts.append(dt, dd); });
        result.signals.forEach(text => { const li = document.createElement('li'); li.textContent = text; signals.append(li); });
      }
      const title = document.getElementById('result-title');
      title.tabIndex = -1;
      title.focus({preventScroll:true});
      output.scrollIntoView({block:'start'});
    }
    form.addEventListener('submit', event => { event.preventDefault(); run(); });
    form.addEventListener('reset', () => { output.hidden = true; facts.replaceChildren(); signals.replaceChildren(); verdict.textContent = ''; });
    const examples = {normal:['https://association.example/contact','association.example'],misleading:['https://association.example@autre-domaine.example/connexion','association.example'],http:['http://192.0.2.10:8080/','']};
    document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { [input.value, expected.value] = examples[button.dataset.example]; run(); }));
    [input, expected].forEach(el => el.addEventListener('input', () => { output.hidden = true; }));
  }
}
