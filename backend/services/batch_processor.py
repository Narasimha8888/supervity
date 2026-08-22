from typing import List
from models import ExpenseClaim, RuleResponse, BatchProcessResponse, BatchClaimResult, ActionEnum
from .evaluator import evaluate_rule

def process_batch(claims: List[ExpenseClaim], active_rules: List[RuleResponse]) -> BatchProcessResponse:
    """
    Evaluates a batch of claims against all active configurable rules.
    """
    total = len(claims)
    approved = 0
    rejected = 0
    escalated = 0
    results = []
    
    # Priority order for actions (Most restrictive wins)
    action_priority = {
        ActionEnum.REJECT.value: 3,
        ActionEnum.ESCALATE.value: 2,
        ActionEnum.APPROVE.value: 1
    }
    
    for claim in claims:
        matched_rules = []
        highest_priority = 0
        final_decision = None
        
        for rule in active_rules:
            # We only evaluate active rules (handled by the caller providing active_rules)
            eval_result = evaluate_rule(rule, claim)
            
            if eval_result.matched:
                matched_rules.append(eval_result)
                
                # Check restrictive priority
                action_val = eval_result.decision
                if action_val in action_priority:
                    priority = action_priority[action_val]
                    if priority > highest_priority:
                        highest_priority = priority
                        final_decision = action_val

        # Deterministic No-Match Fallback
        if not matched_rules:
            final_decision = ActionEnum.ESCALATE.value
            
        # Update counts
        if final_decision == ActionEnum.APPROVE.value:
            approved += 1
        elif final_decision == ActionEnum.REJECT.value:
            rejected += 1
        elif final_decision == ActionEnum.ESCALATE.value:
            escalated += 1
            
        results.append(BatchClaimResult(
            claim_id=claim.id,
            claim_data=claim.dict(),
            decision=final_decision,
            matched_rules=matched_rules
        ))
        
    return BatchProcessResponse(
        total=total,
        approved=approved,
        rejected=rejected,
        escalated=escalated,
        results=results
    )
