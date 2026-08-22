# Policy-Driven Approval Agent

## Project Purpose
The Policy-Driven Approval Agent is a technical screening assessment project. Its ultimate goal is to process expense claims against a set of plain-English business rules, utilizing an AI rule engine (via OpenAI) to deterministically apply these rules to data. The system generates traceably justified APPROVE, REJECT, or ESCALATE decisions.

## Current Phase 1 Scope
This repository currently implements **Phase 1** of the project: setting up a clean, runnable full-stack project foundation. 
**Important Note:** Business rules will be configurable and must NOT be hardcoded in later phases. No AI rule interpretation has been implemented yet, and no real customer data is used.

## Tech Stack
*   **Frontend**: React, Vite, Tailwind CSS
*   **Backend**: Python, FastAPI
*   **Database**: SQLite
*   **AI (Future Phase)**: OpenAI API

## Setup Instructions

### Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   * Windows: `python -m venv venv` and `venv\Scripts\activate`
   * macOS/Linux: `python3 -m venv venv` and `source venv/bin/activate`
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` in the root directory and add any necessary environment variables (e.g., your OpenAI API key for future phases).
5. Initialize the database (from the `database/` directory):
   ```bash
   python init_db.py
   ```

## How to Run

### Run Frontend
1. Navigate to the `frontend/` directory.
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser to the local URL provided (usually `http://localhost:5173`).

### Run Backend
1. Navigate to the `backend/` directory.
2. Ensure your virtual environment is activated.
3. Start the FastAPI application using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```
4. The backend will run on `http://localhost:8000`.

### Verify the Health Endpoint
To test that the backend is running correctly, visit `http://localhost:8000/health` in your browser or run:
```bash
curl http://localhost:8000/health
```
You should see a successful JSON response: `{"status": "ok", "message": "API is running"}`.

## Assumptions
*   The system uses synthetic/mock data only.
*   The rules will be dynamically configured, interpreted by the LLM, and evaluated deterministically by the Python backend. The LLM will not directly make the final approval decision.

## Phase 2: Configurable Business Rules
In Phase 2, we built the foundational configurable policy model and API.

### Rule Model
Rules are stored as configuration rather than hardcoded application logic. Each rule contains:
- `id`: Unique identifier
- `name`: Short name for the rule
- `original_text`: The plain-English version of the rule
- `structured_rule`: A machine-readable JSON representation
- `is_active`: Boolean to toggle the rule's active state
- `created_at` / `updated_at`: Timestamps for version safety

### Structured Rule Schema
The system uses strict Pydantic validation to enforce the schema.
- **Supported Actions**: `APPROVE`, `REJECT`, `ESCALATE`
- **Supported Fields**: `department`, `amount`, `category`
- **Supported Operators**: `equals`, `not_equals`, `less_than`, `less_than_or_equal`, `greater_than`, `greater_than_or_equal`

**Example Structured Rule:**
```json
{
  "action": "APPROVE",
  "conditions": [
    {
      "field": "department",
      "operator": "equals",
      "value": "Sales"
    },
    {
      "field": "amount",
      "operator": "less_than",
      "value": 500
    }
  ]
}
```

### API Endpoints
The following CRUD endpoints are available at `/rules`:
- `GET /rules` - List all rules
- `GET /rules/{rule_id}` - Retrieve a specific rule
- `POST /rules` - Create a new rule
- `PUT /rules/{rule_id}` - Update a rule (e.g. to deactivate it or change its structure)
- `DELETE /rules/{rule_id}` - Delete a rule

### Phase 2 Limitations & Notes
- The AI rule interpretation layer has not yet been implemented.
- Rules are strictly validated; invalid fields or missing conditions will be rejected with an explicit error.
- Multiple rules can coexist, and the decision engine for conflict resolution will be added in a future phase.

## Phase 3: Deterministic Rule Engine
Phase 3 introduced the rule evaluator, safely isolating the evaluation of structured JSON rules without relying on natural language or LLMs. The engine maps strings and numerics properly to ensure safe evaluations and produces fully traceable output evidence per evaluation.

## Phase 4: Batch Processing
In Phase 4, we implemented the orchestration service to evaluate an entire batch of expense claims at once against all active business rules.

### Synthetic Data Source
A collection of 16 highly varied synthetic expense claims is stored locally in `backend/data/claims.json`. Real customer data is never used.

### Deterministic Batch Policies
Since the PDF requirements do not dictate how to handle multiple rule overlap or no-match edge cases, we designed deterministic policies to manage them without involving an AI layer:
- **No-Match Policy**: If a claim matches 0 rules, the final fallback decision defaults to `ESCALATE`.
- **Multiple-Match Policy**: If a claim matches >1 rule, we apply a "Most Restrictive Action" strategy (`REJECT` > `ESCALATE` > `APPROVE`).

### Traceability
The `BatchProcessResponse` includes a full ledger for each claim via `BatchClaimResult`, capturing:
- The exact decision made.
- The claim ID and data.
- Detailed `matched_rules` evaluations containing every condition evaluated (expected vs actual values).

### API Endpoint
- **`POST /claims/process-batch`**
  - **Body**: `[ { "id": "...", "employee": "...", ... } ]` (Optional)
  - **Behavior**: Evaluates provided claims against all active rules. If the body is omitted or empty, it automatically loads the synthetic dataset from `claims.json`.

## Phase 5: AI Rule Interpretation
In Phase 5, we integrated the **OpenAI API** to interpret plain-English business rules and convert them into our deterministic structured JSON schema.

### Architecture Boundaries & Security
> [!IMPORTANT]
> **Strict Separation of Duties**: OpenAI is used **only** to interpret natural-language business rules into a structured representation. Final expense decisions remain 100% deterministic and are made by the Python rule engine inside the backend. The AI does NOT evaluate claims or execute code.

### Input/Output Flow
1. User submits text: `"Auto-approve Sales expenses under $500."`
2. `openai_rule_interpreter.py` translates it into our Pydantic schema using constrained JSON output instructions.
3. The response is validated strictly by the Pydantic `StructuredRule` model.
4. The API returns a preview response (`RuleInterpretationResponse`).
5. **Preview Only**: The interpretation endpoint (`POST /rules/interpret`) does **not** automatically save the rule. It must be explicitly created via the Phase 2 `POST /rules` endpoint afterward.

### Edge Case Handling
- **Ambiguous Rules**: E.g. `"Approve expensive Sales expenses."` Since "expensive" has no numeric threshold, the AI detects ambiguity, aborts JSON construction, and returns a safe `AMBIGUOUS` status without guessing the amount.
- **Unsupported Rules**: E.g. `"Approve if employee tenure > 5 years."` Since tenure is not a supported field in our schema, it returns `UNSUPPORTED`.
- **Invalid Output / Injection**: If malicious prompt-injection occurs, the output fails Pydantic validation and safely aborts (`INVALID`).

### Local Configuration
To test with a live API key (not required for tests):
1. Copy `.env.example` to `.env`
2. Add your `OPENAI_API_KEY`. (Default model is `gpt-3.5-turbo` to reduce costs).

**Note on Testing**: All 15 Phase 5 tests use `unittest.mock` to simulate the OpenAI API, guaranteeing the test suite runs fully offline without requiring an API key or incurring network costs.

## Phase 6: React UI (Workflow-Style Redesign)
In Phase 6, we built a professional, enterprise-grade React frontend UI to consume the existing Phase 2-5 APIs without introducing any new backend business logic. The application is designed as a unified workflow dashboard mimicking complex orchestration interfaces.

### Architecture
- **Stack**: React, Vite, Tailwind CSS (v4).
- **Layout**: A unified two-panel dashboard (`App.jsx`) separating Policy Intake from Policy Evaluation.
- **API Service**: Centralized `api.js` utilizing the native `fetch` API connected to `VITE_API_BASE_URL`. No API keys or secrets are stored in the frontend.

### Features
- **Left Panel (Policy Intake)**: 
  - Allows non-technical users to input natural language rules or use demo scenarios.
  - The UI securely passes the rule text to the `POST /rules/interpret` backend endpoint and visually renders the resulting interpretation (Valid, Ambiguous, Unsupported, or Invalid).
  - Lists all existing active and inactive policies with explicit inline Edit, Deactivate, and Delete actions.
- **Right Panel (Decision Workspace / Evaluation Graph)**:
  - Features a simulated "Policy Evaluation Graph" representing the logical stages of the deterministic backend (Interpreter → Validator → Engine → Decision).
  - Allows users to execute the Phase 4 batch processor against synthetic expense claims.
  - Displays decisions as interactive cards.
  - Clicking a claim slides in a massive **Execution Trace** panel, breaking down exactly which rule matched and exposing the deterministic Evidence (Expected vs. Actual) generated entirely by the Phase 3 Python Rule Engine.

### Frontend Setup
To run the frontend:
```bash
cd frontend
npm install
npm run dev
```
(Ensure the FastAPI backend is running simultaneously on port 8000). The frontend defaults to targeting `http://localhost:8000` via its `.env` configuration.
