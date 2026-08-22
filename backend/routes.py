from fastapi import APIRouter, HTTPException
from typing import List
import json
import database, models

router = APIRouter(
    prefix="/rules",
    tags=["rules"],
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
