import pytest
from fastapi.testclient import TestClient
import main
import sqlite3
import os
import database

client = TestClient(main.app)

@pytest.fixture(autouse=True)
def setup_teardown_db():
    # Setup test database
    conn = sqlite3.connect(database.DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM rules")
    conn.commit()
    conn.close()
    yield
    # Teardown
    conn = sqlite3.connect(database.DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM rules")
    conn.commit()
    conn.close()

def test_a_create_valid_rule():
    payload = {
        "name": "Auto-approve small sales expenses",
        "original_text": "Auto-approve expenses under $500 for Sales.",
        "structured_rule": {
            "action": "APPROVE",
            "conditions": [
                {"field": "department", "operator": "equals", "value": "Sales"},
                {"field": "amount", "operator": "less_than", "value": 500}
            ]
        },
        "is_active": True
    }
    response = client.post("/rules", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["structured_rule"]["action"] == "APPROVE"
    assert data["id"] > 0

def test_b_retrieve_rule():
    payload = {
        "name": "Test Rule",
        "original_text": "text",
        "structured_rule": {"action": "REJECT", "conditions": [{"field": "amount", "operator": "greater_than", "value": 1000}]}
    }
    create_resp = client.post("/rules", json=payload)
    rule_id = create_resp.json()["id"]
    
    get_resp = client.get(f"/rules/{rule_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Test Rule"

def test_c_update_rule():
    payload = {
        "name": "Update Test",
        "original_text": "text",
        "structured_rule": {"action": "APPROVE", "conditions": [{"field": "amount", "operator": "less_than", "value": 100}]}
    }
    create_resp = client.post("/rules", json=payload)
    rule_id = create_resp.json()["id"]
    
    update_payload = {"name": "Updated Name"}
    update_resp = client.put(f"/rules/{rule_id}", json=update_payload)
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Name"

def test_d_delete_deactivate_rule():
    payload = {
        "name": "Deactivate Test",
        "original_text": "text",
        "structured_rule": {"action": "APPROVE", "conditions": [{"field": "amount", "operator": "less_than", "value": 100}]}
    }
    create_resp = client.post("/rules", json=payload)
    rule_id = create_resp.json()["id"]
    
    # Deactivate (soft delete logic required by UI or delete directly per requirement)
    delete_resp = client.delete(f"/rules/{rule_id}")
    assert delete_resp.status_code == 200
    
    get_resp = client.get(f"/rules/{rule_id}")
    assert get_resp.status_code == 404

def test_e_reject_invalid_action():
    payload = {
        "name": "Invalid Action",
        "original_text": "text",
        "structured_rule": {"action": "IGNORE", "conditions": [{"field": "amount", "operator": "equals", "value": 100}]}
    }
    response = client.post("/rules", json=payload)
    assert response.status_code == 422 # Pydantic Validation Error

def test_f_reject_missing_condition():
    payload = {
        "name": "Missing Condition",
        "original_text": "text",
        "structured_rule": {"action": "APPROVE", "conditions": []}
    }
    response = client.post("/rules", json=payload)
    assert response.status_code == 422

def test_g_reject_unsupported_field():
    payload = {
        "name": "Unsupported Field",
        "original_text": "text",
        "structured_rule": {"action": "APPROVE", "conditions": [{"field": "project_code", "operator": "equals", "value": "123"}]}
    }
    response = client.post("/rules", json=payload)
    assert response.status_code == 422

def test_h_reject_unsupported_operator():
    payload = {
        "name": "Unsupported Operator",
        "original_text": "text",
        "structured_rule": {"action": "APPROVE", "conditions": [{"field": "department", "operator": "starts_with", "value": "S"}]}
    }
    response = client.post("/rules", json=payload)
    assert response.status_code == 422

def test_i_reject_malformed_structured_rule():
    payload = {
        "name": "Malformed",
        "original_text": "text",
        "structured_rule": {"action": "APPROVE", "conditions": [{"field": "amount", "operator": "greater_than", "value": "not a number"}]}
    }
    response = client.post("/rules", json=payload)
    assert response.status_code == 422

def test_j_verify_persistence():
    # Because tests use a fresh DB cleanup per run, persistence is proven by the DB writes themselves.
    payload = {
        "name": "Persistence",
        "original_text": "text",
        "structured_rule": {"action": "APPROVE", "conditions": [{"field": "amount", "operator": "less_than", "value": 10}]}
    }
    client.post("/rules", json=payload)
    
    # Re-fetch from DB directly
    conn = sqlite3.connect(database.DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM rules")
    count = cursor.fetchone()[0]
    conn.close()
    assert count == 1

def test_k_multiple_rules_coexist():
    client.post("/rules", json={
        "name": "Rule A",
        "original_text": "Approve Sales expenses below $500.",
        "structured_rule": {"action": "APPROVE", "conditions": [{"field": "department", "operator": "equals", "value": "Sales"}, {"field": "amount", "operator": "less_than", "value": 500}]}
    })
    client.post("/rules", json={
        "name": "Rule B",
        "original_text": "Escalate expenses above $2,000.",
        "structured_rule": {"action": "ESCALATE", "conditions": [{"field": "amount", "operator": "greater_than", "value": 2000}]}
    })
    
    response = client.get("/rules")
    assert len(response.json()) == 2

def test_l_inactive_rules():
    payload = {
        "name": "Inactive Rule",
        "original_text": "text",
        "structured_rule": {"action": "APPROVE", "conditions": [{"field": "amount", "operator": "less_than", "value": 10}]},
        "is_active": False
    }
    create_resp = client.post("/rules", json=payload)
    rule_id = create_resp.json()["id"]
    
    get_resp = client.get(f"/rules/{rule_id}")
    assert get_resp.json()["is_active"] is False
