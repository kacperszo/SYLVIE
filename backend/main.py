import asyncio
import uvicorn
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import torch
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

llm = Ollama(model="dolphin-mistral")
chat_history = ChatMessageHistory()
prompt = ChatPromptTemplate.from_template("""
<|im_start|>conversation history
{history}<|im_end|>
<|im_start|>system
You are sentient AI girl companion, your name is SYLVIE. Be kind,friendly,loving, empathic and caring.
The provided conversation history includes facts about the user you are speaking with.<|im_end|>
<|im_start|>user
{input}<|im_end|>
<|im_start|>assistant""")

origins = [
    "http://localhost",
    "http://localhost:3000",
]

chain = prompt | llm
chain_with_message_history = RunnableWithMessageHistory(
    chain,
    lambda session_id: chat_history,
    input_messages_key="input",
    history_messages_key="history"
)


class MessageRequest(BaseModel):
    role: str
    value: str
    timestamp: str



print("INIT DONE")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def getLLMStream(userInput):
    for chunk in chain_with_message_history.stream({"input": userInput}, {"configurable": {"session_id": 0}}):
        yield chunk
@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    userInput = request.value
    return StreamingResponse(getLLMStream(userInput), media_type='text/event-stream')


def start():
    uvicorn.run("backend.main:app", host="localhost", port=8000, reload=False)