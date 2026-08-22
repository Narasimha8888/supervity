from backend.services.gemini_rule_interpreter import interpret_rule

resp1 = interpret_rule("Approve Sales expenses below $500.")
print("TEST 1 - Valid Rule:")
print(resp1.model_dump())

resp2 = interpret_rule("Approve expensive Sales expenses.")
print("\nTEST 2 - Ambiguous Rule:")
print(resp2.model_dump())
