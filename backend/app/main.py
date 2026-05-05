from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.v1 import invoices

app = FastAPI(
    title="Invoice Ledger API",
    version="1.0.0",
    description="Read-only API serving processed invoice data from the dbt mart layer.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(invoices.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
