import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["project"] == "Sunniye, Samjhiye"
    assert settings.PERSISTENT_DISCLAIMER in data["disclaimer"]

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    # Returns HTML when frontend is built, or JSON when static files not mounted
    assert "<!doctype html>" in response.text.lower() or "Sunniye" in response.text
