# Veille IA & architectures réseau

Le site reste statique. GitHub Actions récupère le RSS Cisco Networking, filtre les publications sur l’IA et les réseaux datant de moins de 90 jours, lit leur contenu éditorial et appelle OpenAI. Les résumés sont enregistrés dans `data/veille.json`, puis le portfolio est publié via GitHub Pages. Le navigateur charge uniquement ce fichier depuis son propre domaine.

## Activation (une fois)

1. Créer une clé dans un projet API OpenAI disposant de crédits. Configurer ses limites et alertes de dépense dans le tableau de bord OpenAI. Le budget de projet peut être une alerte plutôt qu’un arrêt strict : vérifier les paramètres de facturation du compte.
2. Dans GitHub : **Settings → Secrets and variables → Actions → New repository secret**. Nom exact : `OPENAI_API_KEY`. Coller la clé uniquement dans le champ secret GitHub, jamais dans un fichier ou une conversation.
3. Dans **Settings → Pages → Build and deployment → Source**, sélectionner **GitHub Actions**.
4. Dans **Actions → Portfolio - publication et veille IA → Run workflow**, choisir `main`, cocher la génération et lancer. Décocher permet de republier sans aucun appel API.

Si l’organisation interdit l’écriture par les workflows ou protège `main`, autoriser le workflow approprié ou adapter sa publication via PR. Aucun contournement de protection n’est prévu.

## Budget

- Modèle fixe : `gpt-4.1-mini-2025-04-14`.
- Maximum 3 appels par lancement et 60 appels par mois UTC, y compris les tentatives en erreur.
- Extrait de 10 000 caractères maximum ; sortie plafonnée à 1 000 tokens ; pas d’outil de recherche payant.
- Aucun lancement programmé, aucun appel API à l’ouverture du site ou au clic public. Le bouton public recharge les résumés existants.
- Les articles déjà traités sont mémorisés. Le compteur doit rester dans Git ; ne pas réinitialiser `data/veille.json` pour relancer une génération.
- Tarif documentaire consulté le 13 novembre 2026 : 0,40 USD / million de tokens en entrée et 1,60 USD / million en sortie. Exemple indicatif : 3 000 tokens d’entrée + 800 de sortie ≈ 0,00248 USD par fiche, soit ≈ 0,15 USD pour 60 fiches. Ce n’est pas une garantie ni un plafond de facturation ; tarifs, longueur et taxes peuvent varier. Les consommations effectuées ailleurs avec la même clé ne sont pas comptées ici.

## Lire et vérifier

Les fiches affichent la date de l’article, celle de la génération, trois points clés, une piste SISR proposée et les limites de la source. Elles sont étiquetées comme synthèses IA non validées personnellement. Les sources Cisco sont des publications éditeur, à confronter à des références indépendantes. Les lectures ETSI et NIST préexistantes restent dans le carnet documentaire.

Le texte des articles n’est ni archivé dans Git ni publié intégralement. Un extrait est transmis à l’API OpenAI pour synthèse ; la requête utilise `store: false`. Cela ne constitue pas une promesse d’absence de journalisation par le fournisseur. Aucun document privé ou dossier AEIDF ne fait partie du circuit.

## Protections

Sources HTTPS limitées à `blogs.cisco.com/networking/`, vérification des redirections et adresses publiques, prise en compte de `robots.txt`, limites de taille et délais. Les pages sont du contenu non fiable : le LLM n’a aucun outil, aucune clé dans son texte d’entrée et reçoit un schéma de sortie strict. Les sorties sont validées et affichées avec `textContent`, jamais `innerHTML`. Une erreur conserve les fiches précédentes ; une authentification/quota refusé ne déclenche pas de nouvelle tentative automatique.

## Vérifications locales

```text
python -m unittest discover -s tests -p test_veille.py
node --test tests/veille.test.cjs
python scripts/update_veille.py --dry-run
python scripts/build_site.py
```

Le mode `--dry-run` lit les sources publiques sans appeler le LLM ni modifier le cache. Pour consulter le site localement, utiliser un serveur HTTP : les navigateurs peuvent bloquer le chargement JSON depuis `file://`.

## Documentation

- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://blogs.cisco.com/networking/feed
