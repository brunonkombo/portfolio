"""Publie seulement les ressources du portfolio, sans scripts, tests ni secrets."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
out = root / '_site'
out.mkdir(exist_ok=True)
for name in ['index.html', '.nojekyll', 'Bruno NKOMBO CV.pdf']:
    shutil.copy2(root / name, out / name)
for name in ['assets', 'data', 'E5', 'certifications']:
    shutil.copytree(root / name, out / name, dirs_exist_ok=True)
print('Site préparé dans _site/')
