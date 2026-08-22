from models import ExpenseClaim, RuleResponse, EvaluationResult, ConditionResult
from .conditions import evaluate_condition

class MissingDataError(Exception):
    pass

def evaluate_rule(rule: RuleResponse, claim: ExpenseClaim) -> EvaluationResult:
    """
    Evaluates a single structured rule against an expense claim.
    Returns a deterministic EvaluationResult containing evidence.
    """
    condition_results = []
    rule_matched = True
    status = None
    reason = None
    
    # Extract claim data as dictionary for generic field access
    claim_dict = claim.dict()
    
    try:
        for condition in rule.structured_rule.conditions:
            field = condition.field.value
            
            if field not in claim_dict:
                raise MissingDataError(f"Required field '{field}' is missing")
                
            actual_value = claim_dict[field]
            expected_value = condition.value
            operator = condition.operator.value
            
            matched = evaluate_condition(operator, expected_value, actual_value)
            
            condition_results.append(
                ConditionResult(
                    field=field,
                    operator=operator,
                    expected=expected_value,
                    actual=actual_value,
                    matched=matched
                )
            )
            
            # Phase 3 requires AND semantics. If any condition fails, the rule fails.
            if not matched:
                rule_matched = False
                
    except MissingDataError as e:
        return EvaluationResult(
            matched=False,
            status="INSUFFICIENT_DATA",
            reason=str(e),
            rule_id=str(rule.id),
            condition_results=condition_results
        )
    except Exception as e:
        return EvaluationResult(
            matched=False,
            status="ERROR",
            reason=f"Evaluation failed: {str(e)}",
            rule_id=str(rule.id),
            condition_results=condition_results
        )
        
    return EvaluationResult(
        matched=rule_matched,
        decision=rule.structured_rule.action.value if rule_matched else None,
        rule_id=str(rule.id),
        condition_results=condition_results
    )
