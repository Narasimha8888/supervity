import pytest
from datetime import datetime
from models import ExpenseClaim, RuleResponse, StructuredRule, Condition, ActionEnum, FieldEnum, OperatorEnum
from services.evaluator import evaluate_rule

def create_claim(id="EXP-1", emp="John", dept="Sales", amount=350.0, category="Travel"):
    return ExpenseClaim(
        id=id,
        employee=emp,
        department=dept,
        amount=amount,
        category=category,
        description="test",
        date="2026-08-22"
    )

def create_rule(action, conditions):
    return RuleResponse(
        id=1,
        name="Test",
        original_text="Test",
        structured_rule=StructuredRule(action=action, conditions=conditions),
        is_active=True,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

def test_1_sales_350_match():
    # Sales AND amount < $500 -> APPROVE
    claim = create_claim(dept="Sales", amount=350.0)
    rule = create_rule(
        ActionEnum.APPROVE,
        [
            Condition(field=FieldEnum.department, operator=OperatorEnum.equals, value="Sales"),
            Condition(field=FieldEnum.amount, operator=OperatorEnum.less_than, value=500.0)
        ]
    )
    result = evaluate_rule(rule, claim)
    assert result.matched is True
    assert result.decision == "APPROVE"
    assert len(result.condition_results) == 2
    assert all(c.matched for c in result.condition_results)

def test_2_sales_500_no_match():
    # Sales AND amount < $500 -> APPROVE (500 is not < 500)
    claim = create_claim(dept="Sales", amount=500.0)
    rule = create_rule(
        ActionEnum.APPROVE,
        [
            Condition(field=FieldEnum.department, operator=OperatorEnum.equals, value="Sales"),
            Condition(field=FieldEnum.amount, operator=OperatorEnum.less_than, value=500.0)
        ]
    )
    result = evaluate_rule(rule, claim)
    assert result.matched is False
    assert result.decision is None

def test_3_sales_501_no_match():
    claim = create_claim(dept="Sales", amount=501.0)
    rule = create_rule(
        ActionEnum.APPROVE,
        [
            Condition(field=FieldEnum.department, operator=OperatorEnum.equals, value="Sales"),
            Condition(field=FieldEnum.amount, operator=OperatorEnum.less_than, value=500.0)
        ]
    )
    result = evaluate_rule(rule, claim)
    assert result.matched is False

def test_4_finance_350_no_match():
    claim = create_claim(dept="Finance", amount=350.0)
    rule = create_rule(
        ActionEnum.APPROVE,
        [
            Condition(field=FieldEnum.department, operator=OperatorEnum.equals, value="Sales"),
            Condition(field=FieldEnum.amount, operator=OperatorEnum.less_than, value=500.0)
        ]
    )
    result = evaluate_rule(rule, claim)
    assert result.matched is False

def test_5_sales_350_amount_gt_2000_no_match():
    claim = create_claim(dept="Sales", amount=350.0)
    rule = create_rule(ActionEnum.ESCALATE, [Condition(field=FieldEnum.amount, operator=OperatorEnum.greater_than, value=2000.0)])
    result = evaluate_rule(rule, claim)
    assert result.matched is False

def test_6_sales_2500_amount_gt_2000_match():
    claim = create_claim(dept="Sales", amount=2500.0)
    rule = create_rule(ActionEnum.ESCALATE, [Condition(field=FieldEnum.amount, operator=OperatorEnum.greater_than, value=2000.0)])
    result = evaluate_rule(rule, claim)
    assert result.matched is True
    assert result.decision == "ESCALATE"

def test_7_category_comparison():
    claim = create_claim(category="Meals")
    rule = create_rule(ActionEnum.REJECT, [Condition(field=FieldEnum.category, operator=OperatorEnum.equals, value="Meals")])
    result = evaluate_rule(rule, claim)
    assert result.matched is True
    
def test_8_not_equals_comparison():
    claim = create_claim(dept="Marketing")
    rule = create_rule(ActionEnum.APPROVE, [Condition(field=FieldEnum.department, operator=OperatorEnum.not_equals, value="Sales")])
    result = evaluate_rule(rule, claim)
    assert result.matched is True

def test_9_less_than_or_equal():
    claim = create_claim(amount=500.0)
    rule = create_rule(ActionEnum.APPROVE, [Condition(field=FieldEnum.amount, operator=OperatorEnum.less_than_or_equal, value=500.0)])
    result = evaluate_rule(rule, claim)
    assert result.matched is True

def test_10_greater_than_or_equal():
    claim = create_claim(amount=2000.0)
    rule = create_rule(ActionEnum.ESCALATE, [Condition(field=FieldEnum.amount, operator=OperatorEnum.greater_than_or_equal, value=2000.0)])
    result = evaluate_rule(rule, claim)
    assert result.matched is True

def test_11_multiple_conditions_all_match():
    claim = create_claim(dept="Sales", amount=100.0, category="Travel")
    rule = create_rule(ActionEnum.APPROVE, [
        Condition(field=FieldEnum.department, operator=OperatorEnum.equals, value="Sales"),
        Condition(field=FieldEnum.amount, operator=OperatorEnum.less_than, value=200.0),
        Condition(field=FieldEnum.category, operator=OperatorEnum.equals, value="Travel")
    ])
    result = evaluate_rule(rule, claim)
    assert result.matched is True

def test_12_multiple_conditions_one_fails():
    claim = create_claim(dept="Sales", amount=300.0, category="Travel")
    rule = create_rule(ActionEnum.APPROVE, [
        Condition(field=FieldEnum.department, operator=OperatorEnum.equals, value="Sales"),
        Condition(field=FieldEnum.amount, operator=OperatorEnum.less_than, value=200.0), # fails
        Condition(field=FieldEnum.category, operator=OperatorEnum.equals, value="Travel")
    ])
    result = evaluate_rule(rule, claim)
    assert result.matched is False

def test_13_missing_required_field():
    # Since Pydantic requires fields on init, we can simulate by forcing a dictionary
    from services.evaluator import evaluate_rule, MissingDataError
    
    class FakeClaim:
        def dict(self):
            return {"amount": 100} # missing department
            
    rule = create_rule(ActionEnum.APPROVE, [Condition(field=FieldEnum.department, operator=OperatorEnum.equals, value="Sales")])
    result = evaluate_rule(rule, FakeClaim())
    assert result.matched is False
    assert result.status == "INSUFFICIENT_DATA"

def test_14_invalid_structured_rule():
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        Condition(field="invalid_field", operator="equals", value="Sales")

def test_15_unsupported_operator():
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        Condition(field=FieldEnum.amount, operator="is_magic", value=100)

def test_16_unsupported_field():
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        Condition(field="project_id", operator="equals", value=100)

def test_17_invalid_action():
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        StructuredRule(action="MAYBE", conditions=[])

def test_18_negative_expense_amount():
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        create_claim(amount=-50.0)

def test_19_multiple_stored_rules_independent():
    claim1 = create_claim(dept="Sales", amount=400.0)
    rule1 = create_rule(ActionEnum.APPROVE, [Condition(field=FieldEnum.department, operator=OperatorEnum.equals, value="Sales")])
    
    claim2 = create_claim(dept="Finance", amount=2500.0)
    rule2 = create_rule(ActionEnum.ESCALATE, [Condition(field=FieldEnum.amount, operator=OperatorEnum.greater_than, value=2000.0)])
    
    res1 = evaluate_rule(rule1, claim1)
    assert res1.matched is True
    assert res1.decision == "APPROVE"
    
    res2 = evaluate_rule(rule2, claim2)
    assert res2.matched is True
    assert res2.decision == "ESCALATE"
