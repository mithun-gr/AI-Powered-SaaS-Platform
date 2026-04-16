from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import api_router
from config.settings import SUPABASE_URL, QDRANT_URL

import os

app = FastAPI(title="Morchantra AI Support Staff", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    print(f"Starting Backend... connected to Supabase: {SUPABASE_URL}")
    print(f"Qdrant RAG configured at {QDRANT_URL}")

if __name__ == "__main__":
    import uvicorn
    # Make sure to run inside the virtual env
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
