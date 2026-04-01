import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

# Mock the database pool before importing the app
with patch("src.database.init_pool"), patch("src.database.close_pool"):
    from src.main import app

@pytest.fixture
def client():
    """Provides a TestClient for FastAPI app with mocked DB."""
    # We bypass the pool initialization for simple health tests
    with TestClient(app) as c:
        yield c
