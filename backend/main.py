import uvicorn
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Sylvie web server"}

def start():
    uvicorn.run("backend.main:app", host="localhost", port=8000, reload=True)