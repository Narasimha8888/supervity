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
