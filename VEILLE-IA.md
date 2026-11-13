# Veille IA avec Gemini

Le circuit lit le RSS Cisco Networking et les articles publics pertinents, puis demande une synthèse française à Gemini. Les fiches sont enregistrées dans `data/veille.json` et publiées via GitHub Pages. Le navigateur ne reçoit aucune clé.

## Activation gratuite

1. Créer une clé API dans https://aistudio.google.com/apikey avec un projet bénéficiant du **Free Tier**, sans activer la facturation. Une vérification du projet peut être demandée par Google.
2. Dans GitHub : **Settings → Secrets and variables → Actions → New repository secret**. Nom exact : `GEMINI_API_KEY`. Coller la clé uniquement dans le champ Secret.
3. Dans **Actions → Portfolio - publication et veille IA → Run workflow**, choisir `main` et cocher la génération. Décocher republie uniquement le site.
4. GitHub Pages utilise **GitHub Actions** comme source de publication (déjà configuré).

Le flux n'utilise plus OpenAI ni le secret `OPENAI_API_KEY`. Aucun repli vers un fournisseur payant n'est prévu.

## Gratuité et quotas

- Modèle : `gemini-3.5-flash-lite`, proposé dans le Free Tier selon la documentation Google consultée le 13 novembre 2026.
- La gratuité dépend du modèle, de l'éligibilité et de l'offre du projet Google. Le code ne peut pas vérifier l'état de facturation d'une clé : une clé provenant d'un projet payant peut entraîner des frais. Garder un projet Free Tier sans facturation pour éviter cela.
- Maximum 3 appels par lancement et 60 par mois UTC, tentatives échouées incluses. Les limites Google peuvent être inférieures et évoluer. Un quota dépassé arrête les appels, sans nouvelle tentative automatique.
- Extrait limité à 10 000 caractères, sortie à 1 400 tokens. Aucun outil payant de recherche ou d'exécution n'est utilisé.
- Aucun lancement programmé. Les boutons publics consultent/rechargent les fiches publiées sans appeler le LLM.
- Les articles déjà traités sont mémorisés ; ne pas réinitialiser le cache et son compteur pour relancer une génération.

## Sources et confidentialité

Uniquement des articles publics de Cisco Networking datant de moins de 30 jours. Leurs extraits sont envoyés à Google pour produire une synthèse ; le texte intégral n'est pas archivé dans Git. Selon l'offre gratuite et les conditions applicables, Google peut utiliser les données pour améliorer ses produits. Aucun document personnel, dossier AEIDF ou contenu confidentiel n'entre dans ce circuit.

Les fiches sont étiquetées comme synthèses IA à vérifier avec la source. Elles conservent les dates de publication et de génération, trois points clés, une piste SISR et les limites. Les références ETSI et NIST restent dans le carnet documentaire. Une synthèse IA ne remplace pas l'analyse personnelle.

## Protections

Sources HTTPS limitées à `blogs.cisco.com/networking/`, contrôle des redirections et adresses publiques, `robots.txt`, tailles et délais limités. Les articles sont traités comme du contenu non fiable. Le LLM n'a ni outil ni accès aux secrets dans son contexte ; sortie JSON contrôlée et rendu via `textContent`. Les réponses bloquées ou tronquées sont refusées. Les fiches précédentes sont conservées en cas d'échec.

## Vérifications

```text
python -m unittest discover -s tests -p test_veille.py
node --test tests/veille.test.cjs
python scripts/update_veille.py --dry-run
python scripts/build_site.py
```

Le mode `--dry-run` vérifie les sources sans appel LLM ni écriture. Un serveur HTTP est nécessaire pour charger le JSON en local.

## Documentation officielle

- https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite
- https://aistudio.google.com/docs/api-key
- https://aistudio.google.com/api-reference/generate-content
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Pertinence métier

La sélection exige un apport concret sur la sécurité, l’exploitation, l’automatisation ou la conception réseau. Le LLM écarte les promotions événementielles sans contenu technique ; ce filtre reste faillible. Chaque fiche explique pourquoi l’information compte, propose une compétence/action de lab pour un futur administrateur et un compromis d’architecture à évaluer pour un futur ingénieur. Ces propositions ne sont pas des résultats de tests ni des conseils validés en production.

L’interface affiche par défaut les publications des 30 derniers jours, triées de la plus récente à la plus ancienne. Le sélecteur Archives donne accès aux anciennes fiches. Les fiches déjà publiées avant cette évolution sont enrichies une fois (version 2), en conservant le compteur d’appels. La génération reste à la demande, sans surveillance programmée.
