import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from datetime import datetime, timezone
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('veille', Path(__file__).resolve().parents[1] / 'scripts/update_veille.py')
veille = importlib.util.module_from_spec(spec)
spec.loader.exec_module(veille)


def summary():
    return {'relevant': True, 'title': 'Une supervision assistée', 'summary': 'Le document présente une méthode de diagnostic.',
            'key_points': ['Une proposition à tester.'], 'sisr': 'Comparer les alertes dans un lab.',
            'limits': 'Présentation éditeur.', 'topic': 'supervision'}


class VeilleTests(unittest.TestCase):
    def test_untrusted_urls_are_rejected(self):
        for url in ['http://blogs.cisco.com/networking/a', 'https://blogs.cisco.com.evil.test/networking/a',
                    'https://blogs.cisco.com@evil.test/networking/a', 'https://127.0.0.1/networking/a',
                    'https://blogs.cisco.com:8443/networking/a', 'file:///secret', 'https://blogs.cisco.com/admin']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                veille.safe_source_url(url)

    def test_canonical_link_drops_tracking(self):
        self.assertEqual(veille.safe_source_url('https://blogs.cisco.com/networking/a/?utm_source=rss#x'),
                         'https://blogs.cisco.com/networking/a/')

    def test_private_dns_is_rejected(self):
        with patch.object(veille.socket, 'getaddrinfo', return_value=[(0, 0, 0, '', ('127.0.0.1', 443))]):
            with self.assertRaises(ValueError):
                veille.check_public_dns(veille.FEED)

    def test_xml_entities_are_rejected(self):
        with self.assertRaises(ValueError):
            veille.parse_feed('<!DOCTYPE rss [<!ENTITY a "boom">]><rss/>')

    def test_feed_filters_age_topic_and_duplicates(self):
        def item(title, date, slug):
            return f'<item><title>{title}</title><link>https://blogs.cisco.com/networking/{slug}/</link><pubDate>{date}</pubDate></item>'
        good = item('AI network diagnosis', 'Thu, 12 Nov 2026 12:00:00 GMT', 'test')
        xml = '<rss><channel>' + good + good + item('Golf day', 'Thu, 12 Nov 2026 12:00:00 GMT', 'golf') + item('AI network old', 'Mon, 01 Jan 2024 12:00:00 GMT', 'old') + '</channel></rss>'
        items = veille.parse_feed(xml, datetime(2026, 11, 13, tzinfo=timezone.utc))
        self.assertEqual(len(items), 1)

    def test_extraction_ignores_active_and_navigation_content(self):
        text, _ = veille.extract_article('<nav>BAD_NAV</nav><article><script>BAD_SCRIPT</script><p>' + 'Network analysis. ' * 80 + '</p></article>')
        self.assertNotIn('BAD', text)

    def test_no_article_no_fabrication(self):
        with self.assertRaises(ValueError):
            veille.extract_article('<html><nav>Only navigation</nav></html>')

    def test_summary_limits(self):
        data = summary()
        data['key_points'] = ['point'] * 4
        with self.assertRaises(ValueError):
            veille.validate_summary(data)

    def test_api_incomplete_is_rejected(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, size): return b'{"status":"incomplete","output":[]}'
        with patch.object(veille.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value = Response()
            with self.assertRaises(ValueError):
                veille.summarize({'source_title': 'Source'}, 'texte', 'test-key')

    def run_fixture(self, calls=0, api_error=False):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        file = Path(temp.name) / 'veille.json'
        month = datetime.now(timezone.utc).strftime('%Y-%m')
        file.write_text(json.dumps({'version': 1, 'articles': [], 'processed_ids': [], 'budget': {'month': month, 'calls': calls}}))
        candidates = [{'id': str(i), 'url': f'https://blogs.cisco.com/networking/test-{i}/', 'source_title': 'AI network',
                       'source': 'Cisco Networking', 'published_at': veille.now_iso()} for i in range(8)]
        fetch = lambda url: 'User-agent: *\nAllow: /' if url.endswith('robots.txt') else '<article>' + 'AI network test ' * 100 + '</article>'
        self.enterContext(patch.object(veille, 'DATA', file))
        self.enterContext(patch.object(veille, 'fetch_source', side_effect=fetch))
        self.enterContext(patch.object(veille, 'parse_feed', return_value=candidates))
        self.enterContext(patch.dict(os.environ, {'OPENAI_API_KEY': 'test-only'}))
        api = self.enterContext(patch.object(veille, 'summarize', side_effect=HTTPError('api', 429, 'Quota', {}, None) if api_error else lambda *args: summary()))
        return file, api

    def test_per_run_limit_and_deduplication(self):
        file, api = self.run_fixture()
        veille.run()
        self.assertEqual(api.call_count, 3)
        first_ids = {a['id'] for a in json.loads(file.read_text())['articles']}
        veille.run()
        state = json.loads(file.read_text())
        self.assertEqual(len(state['articles']), 6)
        self.assertEqual(len({a['id'] for a in state['articles']}), 6)
        self.assertTrue(first_ids <= {a['id'] for a in state['articles']})

    def test_monthly_cap(self):
        file, api = self.run_fixture(calls=59)
        veille.run()
        self.assertEqual(api.call_count, 1)
        self.assertEqual(json.loads(file.read_text())['budget']['calls'], 60)

    def test_quota_failure_counted_without_retry(self):
        file, api = self.run_fixture(api_error=True)
        with self.assertRaises(ValueError): veille.run()
        self.assertEqual(api.call_count, 1)
        self.assertEqual(json.loads(file.read_text())['budget']['calls'], 1)
        self.assertEqual(json.loads(file.read_text())['articles'], [])

    def test_dry_run_no_api_or_file_mutation(self):
        file, api = self.run_fixture()
        before = file.read_bytes()
        veille.run(dry_run=True)
        api.assert_not_called()
        self.assertEqual(before, file.read_bytes())


if __name__ == '__main__':
    unittest.main()
