from typing import Any
from models import OperatorEnum

def evaluate_condition(operator: str, expected_value: Any, actual_value: Any) -> bool:
    """
    Evaluates a single condition generically based on the operator.
    Safely handles type comparisons by ensuring actual and expected are comparable.
    """
    
    # Try to cast actual_value to the same type as expected_value for safe comparison
    # Especially for numeric comparisons
    if isinstance(expected_value, (int, float)):
        try:
            actual_val_cmp = float(actual_value)
            expected_val_cmp = float(expected_value)
        except (ValueError, TypeError):
            return False
    else:
        # String comparisons
        actual_val_cmp = str(actual_value) if actual_value is not None else ""
        expected_val_cmp = str(expected_value)

    if operator == OperatorEnum.equals:
        return actual_val_cmp == expected_val_cmp
    elif operator == OperatorEnum.not_equals:
        return actual_val_cmp != expected_val_cmp
    elif operator == OperatorEnum.less_than:
        return actual_val_cmp < expected_val_cmp
    elif operator == OperatorEnum.less_than_or_equal:
        return actual_val_cmp <= expected_val_cmp
    elif operator == OperatorEnum.greater_than:
        return actual_val_cmp > expected_val_cmp
    elif operator == OperatorEnum.greater_than_or_equal:
        return actual_val_cmp >= expected_val_cmp
    else:
        # Should be caught by validation, but just in case
        return False
