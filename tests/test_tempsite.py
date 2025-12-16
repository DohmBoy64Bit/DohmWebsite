import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import json

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.temp_site_service import TempSiteService

class TestTempSiteService(unittest.TestCase):
    def setUp(self):
        # Mock the redis client
        self.redis_patcher = patch('services.temp_site_service.redis')
        self.mock_redis = self.redis_patcher.start()

    def tearDown(self):
        self.redis_patcher.stop()

    def test_create_site(self):
        # Test data
        html = "<h1>Test</h1>"
        css = "h1 { color: red; }"
        js = "console.log('test')"
        
        # Call the service
        site_id = TempSiteService.create_site(html, css, js)
        
        # Verify Redis set was called
        self.assertTrue(self.mock_redis.set.called)
        
        # Verify correct data storage
        args, _ = self.mock_redis.set.call_args
        stored_key = args[0]
        stored_val = json.loads(args[1])
        
        self.assertEqual(stored_key, f"tempsite:{site_id}")
        self.assertEqual(stored_val['html'], html)
        self.assertEqual(stored_val['css'], css)
        self.assertEqual(stored_val['js'], js)
        self.assertEqual(stored_val['id'], site_id)
        
        # Verify Expiration (86400 seconds = 24 hours)
        self.mock_redis.expire.assert_called_with(f"tempsite:{site_id}", 86400)

    def test_get_site_success(self):
        site_id = "test-uuid"
        mock_data = {
            'id': site_id,
            'html': "<h1>Test</h1>",
            'css': "",
            'js': "",
            'views': 0
        }
        
        # Mock redis return
        self.mock_redis.get.return_value = json.dumps(mock_data)
        
        # Call service
        result = TempSiteService.get_site(site_id)
        
        # Verify result
        self.assertEqual(result['html'], "<h1>Test</h1>")
        self.assertEqual(result['id'], site_id)
        
        # Verify view count increment attempt
        self.assertTrue(self.mock_redis.set.called)

    def test_get_site_not_found(self):
        # Mock redis return None
        self.mock_redis.get.return_value = None
        
        result = TempSiteService.get_site("non-existent")
        self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main()
