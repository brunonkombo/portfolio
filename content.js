document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const value = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    document.querySelectorAll('.source-v2').forEach(source => { const show = value === 'all' || source.dataset.topic === value; source.hidden = !show; if(show) count++; });
    document.getElementById('source-count').textContent = count + (count === 1 ? ' source affichée' : ' sources affichées');
  });
});
