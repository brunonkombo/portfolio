const toggle = document.querySelector('.motion-toggle');
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motion = !preference.matches;
function updateMotion() {
  document.body.classList.toggle('motion-off', !motion);
  toggle.textContent = 'ANIMATIONS : ' + (motion ? 'ON' : 'OFF');
  toggle.setAttribute('aria-pressed', String(!motion));
  toggle.setAttribute('aria-label', motion ? 'Désactiver les animations' : 'Activer les animations');
}
toggle.addEventListener('click', () => { motion = !motion; updateMotion(); });
preference.addEventListener('change', () => { motion = !preference.matches; updateMotion(); });
updateMotion();
