"""
Verification script using TestClient to test all API endpoints:
- GET /api/languages
- POST /api/translate
- POST /api/detect
Mocks the external Google Cloud Translation REST API responses to verify success, validation, and error states.
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


class TestTranslationAPI(unittest.TestCase):

    @patch("httpx.AsyncClient.get")
    def test_get_languages_success(self, mock_get):
        """Test GET /api/languages returns valid supported languages list."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "languages": [
                    {"language": "en", "name": "English"},
                    {"language": "fr", "name": "French"}
                ]
            }
        }
        mock_get.return_value = mock_response

        response = client.get("/api/languages")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [
            {"code": "en", "name": "English"},
            {"code": "fr", "name": "French"}
        ])

    @patch("httpx.AsyncClient.post")
    @patch("httpx.AsyncClient.get")
    def test_translate_success(self, mock_get, mock_post):
        """Test POST /api/translate successfully returns translation."""
        # Mock active languages list to bypass endpoint validation check
        mock_get_resp = MagicMock()
        mock_get_resp.status_code = 200
        mock_get_resp.json.return_value = {
            "data": {
                "languages": [
                    {"language": "en", "name": "English"},
                    {"language": "fr", "name": "French"}
                ]
            }
        }
        mock_get.return_value = mock_get_resp

        # Mock translation request response
        mock_post_resp = MagicMock()
        mock_post_resp.status_code = 200
        mock_post_resp.json.return_value = {
            "data": {
                "translations": [
                    {"translatedText": "Bonjour", "detectedSourceLanguage": "en"}
                ]
            }
        }
        mock_post.return_value = mock_post_resp

        payload = {
            "text": "Hello",
            "source": "en",
            "target": "fr"
        }
        response = client.post("/api/translate", json=payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"translated_text": "Bonjour"})

    @patch("httpx.AsyncClient.get")
    def test_translate_unsupported_language(self, mock_get):
        """Test POST /api/translate rejects unsupported language codes."""
        # Mock supported languages list
        mock_get_resp = MagicMock()
        mock_get_resp.status_code = 200
        mock_get_resp.json.return_value = {
            "data": {
                "languages": [
                    {"language": "en", "name": "English"}
                ]
            }
        }
        mock_get.return_value = mock_get_resp

        payload = {
            "text": "Hello",
            "source": "en",
            "target": "de"  # de is not in mock supported list
        }
        response = client.post("/api/translate", json=payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Target language 'de' is not supported", response.json()["detail"])

    def test_translate_validation_empty_text(self):
        """Test POST /api/translate rejects empty text."""
        payload = {
            "text": "   ",
            "source": "en",
            "target": "fr"
        }
        response = client.post("/api/translate", json=payload)
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("Text cannot be empty", response.text)

    def test_translate_validation_too_long(self):
        """Test POST /api/translate rejects text longer than 5000 chars."""
        payload = {
            "text": "a" * 5001,
            "source": "en",
            "target": "fr"
        }
        response = client.post("/api/translate", json=payload)
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("Text cannot exceed 5000 characters", response.text)

    @patch("httpx.AsyncClient.post")
    def test_detect_success(self, mock_post):
        """Test POST /api/detect successfully detects text language."""
        # Mock detection response
        mock_post_resp = MagicMock()
        mock_post_resp.status_code = 200
        mock_post_resp.json.return_value = {
            "data": {
                "detections": [
                    [
                        {"confidence": 0.99, "language": "fr"},
                        {"confidence": 0.01, "language": "en"}
                    ]
                ]
            }
        }
        mock_post.return_value = mock_post_resp

        payload = {
            "text": "Bonjour"
        }
        response = client.post("/api/detect", json=payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"language": "fr", "confidence": 0.99})

    def test_detect_validation_empty(self):
        """Test POST /api/detect rejects empty or whitespace-only text."""
        payload = {
            "text": ""
        }
        response = client.post("/api/detect", json=payload)
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)


if __name__ == "__main__":
    unittest.main()
