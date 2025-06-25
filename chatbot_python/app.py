from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from intent_service import classify_intent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    message: str

@app.post("/api/intent")
def detect_intent(query: Query):
    intent = classify_intent(query.message)
    print(f"[Intent Detected]: {intent}")
    return {"intent": intent}
