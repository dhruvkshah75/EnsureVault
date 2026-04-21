def test_health_check(client):
    """Test the base health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert data["service"] == "EnsureVault API"
