from pydantic import BaseModel, Field, validator, ValidationError
from typing import List, Union, Optional
from enum import Enum
from datetime import datetime

class ActionEnum(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    ESCALATE = "ESCALATE"

class FieldEnum(str, Enum):
    department = "department"
    amount = "amount"
    category = "category"

class OperatorEnum(str, Enum):
    equals = "equals"
    not_equals = "not_equals"
    less_than = "less_than"
    less_than_or_equal = "less_than_or_equal"
    greater_than = "greater_than"
    greater_than_or_equal = "greater_than_or_equal"

class Condition(BaseModel):
    field: FieldEnum
    operator: OperatorEnum
    value: Union[int, float, str]

    @validator("value")
    def validate_value(cls, v, values):
        field = values.get("field")
        operator = values.get("operator")
        
        # If field is amount, value must be numeric
        if field == FieldEnum.amount:
            if not isinstance(v, (int, float)):
                raise ValueError("amount field requires a numeric value")
            if v < 0:
                raise ValueError("amount must be non-negative")
                
        # If field is department or category, it should be string
        if field in [FieldEnum.department, FieldEnum.category]:
            if not isinstance(v, str):
                raise ValueError(f"{field.value} field requires a string value")
            if operator and operator not in [OperatorEnum.equals, OperatorEnum.not_equals]:
                raise ValueError(f"operator {operator.value} is not supported for string fields")
                
        return v

class StructuredRule(BaseModel):
    action: ActionEnum
    conditions: List[Condition] = Field(..., min_items=1)

class RuleCreate(BaseModel):
    name: str = Field(..., min_length=1)
    original_text: str = Field(..., min_length=1)
    structured_rule: StructuredRule
    is_active: bool = True

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    original_text: Optional[str] = None
    structured_rule: Optional[StructuredRule] = None
    is_active: Optional[bool] = None

class RuleResponse(BaseModel):
    id: int
    name: str
    original_text: str
    structured_rule: StructuredRule
    is_active: bool
    created_at: datetime
    updated_at: datetime
