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

class ExpenseClaim(BaseModel):
    id: str
    employee: str
    department: str
    amount: float
    category: str
    description: str
    date: str

    @validator("amount")
    def validate_amount(cls, v):
        if v < 0:
            raise ValueError("amount must be non-negative")
        return v

class ConditionResult(BaseModel):
    field: str
    operator: str
    expected: Union[int, float, str]
    actual: Optional[Union[int, float, str]] = None
    matched: bool

class EvaluationResult(BaseModel):
    matched: bool
    decision: Optional[str] = None
    rule_id: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    condition_results: List[ConditionResult] = []

class BatchClaimResult(BaseModel):
    claim_id: str
    claim_data: dict
    decision: str
    matched_rules: List[EvaluationResult] = []
    
class BatchProcessResponse(BaseModel):
    total: int
    approved: int
    rejected: int
    escalated: int
    results: List[BatchClaimResult]

class RuleInterpretationStatus(str, Enum):
    VALID = "VALID"
    AMBIGUOUS = "AMBIGUOUS"
    UNSUPPORTED = "UNSUPPORTED"
    INVALID = "INVALID"

class RuleInterpretationRequest(BaseModel):
    rule_text: str

class RuleInterpretationResponse(BaseModel):
    status: RuleInterpretationStatus
    original_text: str
    structured_rule: Optional[StructuredRule] = None
    message: Optional[str] = None
