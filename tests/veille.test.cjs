const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validArticle} = require('../assets/veille.js');
const article = {id:'test', title:'Titre', summary:'Résumé', sisr:'Piste', limits:'Limites', source:'Cisco Networking', source_title:'Original', model:'test', topic:'supervision', key_points:['Un point'], url:'https://blogs.cisco.com/networking/test/', published_at:'2026-11-12T12:00:00Z', generated_at:'2026-11-13T12:00:00Z'};
test('une fiche complète est acceptée', () => assert.equal(validArticle(article), true));
test('un lien actif ou un domaine trompeur est refusé', () => {
  for(const url of ['javascript:alert(1)', 'https://blogs.cisco.com.evil.test/networking/a', 'https://blogs.cisco.com@evil.test/networking/a', 'http://blogs.cisco.com/networking/a']) assert.equal(validArticle({...article, url}), false);
});
test('une fiche incomplète ou surdimensionnée est refusée', () => {
  assert.equal(validArticle({...article, summary:'a'.repeat(1201)}), false);
  assert.equal(validArticle({...article, generated_at:'bad'}), false);
  assert.equal(validArticle({...article, key_points:[{}]}), false);
  assert.equal(validArticle(null), false);
});
