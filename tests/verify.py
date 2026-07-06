"""
Verification script using TestClient to test list_languages endpoint functionality.
Mocks the external LibreTranslate API responses to verify success and error states.
"""
import sys
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from fastapi import status
from main import app

client = TestClient(app)


class TestLanguagesEndpoint(unittest.TestCase):

    @patch("httpx.AsyncClient.get")
    def test_get_languages_success(self, mock_get):
        """Test GET /api/languages successfully returns language list from LibreTranslate."""
        # Setup mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"code": "en", "name": "English"},
            {"code": "es", "name": "Spanish"}
        ]
        mock_get.return_value = mock_response

        # Execute request
        response = client.get("/api/languages")
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [
            {"code": "en", "name": "English"},
            {"code": "es", "name": "Spanish"}
        ])

    @patch("httpx.AsyncClient.get")
    def test_get_languages_service_unavailable(self, mock_get):
        """Test GET /api/languages returns 503 when LibreTranslate connection fails."""
        import httpx
        # Force a connection error
        mock_get.side_effect = httpx.ConnectError("Connection refused")

        # Execute request
        response = client.get("/api/languages")
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("Unable to connect to the translation service", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
