import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_and_manage_intake():
    # 1. Create intake with custom ID
    create_payload = {
        "patient_display_id": "TEST-1001",
        "raw_transcript": "Patient reports fever for 2 days.",
        "transcript_language": "en-IN",
        "is_demo": True
    }
    response = client.post("/api/intakes", json=create_payload)
    assert response.status_code == 201
    created = response.json()
    intake_id = created["id"]
    assert created["patient_display_id"] == "TEST-1001"
    assert created["status"] == "draft"

    # 2. Get intake by ID
    get_res = client.get(f"/api/intakes/{intake_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == intake_id

    # 3. Update intake with reviewed facts and summary
    update_payload = {
        "status": "approved",
        "reviewed_transcript": "Patient reports fever for 2 days. No cough.",
        "summary_approved": "Factual patient reported summary.",
        "approved_by_worker": "Nurse Pratibha"
    }
    patch_res = client.patch(f"/api/intakes/{intake_id}", json=update_payload)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "approved"
    assert updated["approved_by_worker"] == "Nurse Pratibha"
    assert updated["approved_at"] is not None

    # 4. List intakes
    list_res = client.get("/api/intakes")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(i["id"] == intake_id for i in items)

    # 5. Delete intake
    del_res = client.delete(f"/api/intakes/{intake_id}")
    assert del_res.status_code == 204

    # 6. Verify deleted
    get_del = client.get(f"/api/intakes/{intake_id}")
    assert get_del.status_code == 404

def test_auto_generate_patient_id():
    response = client.post("/api/intakes", json={"is_demo": True})
    assert response.status_code == 201
    data = response.json()
    assert data["patient_display_id"].startswith("PT-")

