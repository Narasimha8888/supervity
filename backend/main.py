from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router as rules_router

app = FastAPI(title="Policy-Driven Approval Agent API")

# Configure CORS so the local React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For phase 1, allow all. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rules_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}
