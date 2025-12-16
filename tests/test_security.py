import unittest
from flask import Flask
from unittest.mock import patch, MagicMock
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from services.temp_site_service import TempSiteService

class TestSecurityRedirects(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    @patch('services.temp_site_service.TempSiteService.get_site')
    def test_localhost_no_redirect(self, mock_get_site):
        """Test that localhost does NOT redirect (dev mode)"""
        # Mock site existing
        mock_get_site.return_value = {'html': 'safe', 'css': '', 'js': ''}
        
        # Request with Host: localhost
        response = self.app.get('/temp/view/12345', headers={'Host': 'localhost:5000'})
        
        # Should be 200 OK (No redirect)
        self.assertEqual(response.status_code, 200)

    @patch('services.temp_site_service.TempSiteService.get_site')
    def test_production_redirect(self, mock_get_site):
        """Test that main domain Redirects to Content Domain"""
        # Mock site existing
        mock_get_site.return_value = {'html': 'safe', 'css': '', 'js': ''}
        
        # Request with Host: dohmboy64.com
        response = self.app.get('/temp/view/12345', headers={'Host': 'dohmboy64.com'})
        
        # Should be 301 Redirect
        self.assertEqual(response.status_code, 301)
        # Should redirect to content domain
        self.assertTrue('www.content.dohmboy64.com' in response.headers['Location'])

if __name__ == '__main__':
    unittest.main()
