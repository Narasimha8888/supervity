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
