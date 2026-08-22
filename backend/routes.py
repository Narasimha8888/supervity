from fastapi import APIRouter, HTTPException
from typing import List, Optional
import json
import os
import database, models
from services.batch_processor import process_batch

router = APIRouter(
    prefix="/rules",
    tags=["rules"],
)

claims_router = APIRouter(
    prefix="/claims",
    tags=["claims"],
)

def _format_rule_response(db_rule: dict) -> models.RuleResponse:
    try:
        structured_rule = json.loads(db_rule['structured_rule'])
    except json.JSONDecodeError:
        structured_rule = {}
        
    return models.RuleResponse(
        id=db_rule['id'],
        name=db_rule['name'],
        original_text=db_rule['original_text'],
        structured_rule=models.StructuredRule(**structured_rule),
        is_active=bool(db_rule['is_active']),
        created_at=db_rule['created_at'],
        updated_at=db_rule['updated_at']
    )

@router.get("", response_model=List[models.RuleResponse])
def get_rules():
    rules = database.get_all_rules()
    return [_format_rule_response(rule) for rule in rules]

@router.get("/{rule_id}", response_model=models.RuleResponse)
def get_rule(rule_id: int):
    rule = database.get_rule_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return _format_rule_response(rule)

@router.post("", response_model=models.RuleResponse)
def create_rule(rule: models.RuleCreate):
    rule_id = database.create_rule(
        name=rule.name,
        original_text=rule.original_text,
        structured_rule=rule.structured_rule.dict(),
        is_active=rule.is_active
    )
    new_rule = database.get_rule_by_id(rule_id)
    return _format_rule_response(new_rule)

@router.put("/{rule_id}", response_model=models.RuleResponse)
def update_rule(rule_id: int, rule_update: models.RuleUpdate):
    existing_rule = database.get_rule_by_id(rule_id)
    if not existing_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    updates = {}
    if rule_update.name is not None:
        updates['name'] = rule_update.name
    if rule_update.original_text is not None:
        updates['original_text'] = rule_update.original_text
    if rule_update.structured_rule is not None:
        updates['structured_rule'] = json.dumps(rule_update.structured_rule.dict())
    if rule_update.is_active is not None:
        updates['is_active'] = rule_update.is_active
        
    database.update_rule(rule_id, updates)
    updated = database.get_rule_by_id(rule_id)
    return _format_rule_response(updated)

@router.delete("/{rule_id}")
def delete_rule(rule_id: int):
    existing_rule = database.get_rule_by_id(rule_id)
    if not existing_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    success = database.delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete rule")
        
    return {"status": "success", "message": "Rule deleted"}

@claims_router.post("/process-batch", response_model=models.BatchProcessResponse)
def process_claims_batch(claims: Optional[List[models.ExpenseClaim]] = None):
    # Load rules
    db_rules = database.get_all_rules()
    
    # Filter only active rules
    active_rules = []
    for r in db_rules:
        if r["is_active"]:
            try:
                active_rules.append(
                    models.RuleResponse(
                        id=r["id"],
                        name=r["name"],
                        original_text=r["original_text"],
                        structured_rule=json.loads(r["structured_rule"]),
                        is_active=bool(r["is_active"]),
                        created_at=r["created_at"],
                        updated_at=r["updated_at"]
                    )
                )
            except Exception:
                # Skip malformed rules
                continue
                
    if not active_rules:
        raise HTTPException(status_code=400, detail="No active rules available for processing")
        
    # If no claims provided, load synthetic
    if claims is None:
        try:
            claims_path = os.path.join(os.path.dirname(__file__), "data", "claims.json")
            with open(claims_path, "r") as f:
                claims_data = json.load(f)
                claims = [models.ExpenseClaim(**c) for c in claims_data]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load synthetic claims: {str(e)}")
            
    if len(claims) == 0:
        raise HTTPException(status_code=400, detail="Empty claim batch provided")
        
    return process_batch(claims, active_rules)
