import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import router as rules_router, claims_router
import database

# Ensure SQLite database and tables are created
database.init_db()

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
app.include_router(claims_router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

# Serve frontend static files
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        file_path = os.path.join(frontend_dist, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
