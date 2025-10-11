from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import asyncio
import json
from .log_simulator import generate_log

app = FastAPI(title="Server Shepherd Backend")

# Allow local dev from file:// or http://localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def index():
    return FileResponse("static/index.html")

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/metrics")
async def metrics():
    # Simple rolling metrics; front-end already animates bars.
    # Replace with real data collection later.
    return {
        "cpu": 0,
        "memory": 0,
        "disk": 0,
        "network": 0,
    }

# Simple in-memory broadcast hub
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: Dict[str, Any]):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(message))
            except WebSocketDisconnect:
                dead.append(ws)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Greet client
        await ws.send_text(json.dumps({"type": "welcome", "message": "connected"}))
        # Echo minimal pings from client (optional)
        while True:
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=5.0)
                # Optionally handle client commands
                # e.g., {"action": "simulate", "level": "ERROR"}
                try:
                    payload = json.loads(data)
                    if payload.get("action") == "simulate":
                        log = generate_log(payload.get("level", "INFO"))
                        await manager.broadcast({"type": "log", "data": log})
                except json.JSONDecodeError:
                    pass
            except asyncio.TimeoutError:
                # Periodic push: metrics
                await manager.broadcast({"type": "metrics", "data": {
                    "cpu": 60, "memory": 70, "disk": 47, "network": 80
                }})
    except WebSocketDisconnect:
        manager.disconnect(ws)

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncio, json

from .db import DB
from .log_simulator import generate_log

db = DB()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    try:
        yield
    finally:
        await db.close()

app = FastAPI(title="Server Shepherd Backend", lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def index(): return FileResponse("static/index.html")
@app.get("/api/logs")
async def api_logs(limit: int = 50): return await db.recent_logs(limit)

class Manager:
    def __init__(self): self.clients: list[WebSocket] = []
    async def connect(self, ws: WebSocket): await ws.accept(); self.clients.append(ws)
    def disconnect(self, ws: WebSocket): 
        if ws in self.clients: self.clients.remove(ws)
    async def broadcast(self, msg: dict):
        dead=[]
        for c in self.clients:
            try: await c.send_text(json.dumps(msg))
            except: dead.append(c)
        for c in dead: self.disconnect(c)

manager = Manager()

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Hydrate UI with recent logs
        logs = await db.recent_logs(20)
        await ws.send_text(json.dumps({"type": "initial_logs", "data": logs}))
        # Listen for client actions
        while True:
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=5.0)
                payload = json.loads(data)
                if payload.get("action") == "simulate":
                    level = payload.get("level", "INFO")
                    log = generate_log(level)
                    await db.insert_log(log["timestamp"], log["level"], log["message"], log["server"], log["service"])
                    await manager.broadcast({"type": "log", "data": log})
            except asyncio.TimeoutError:
                pass
    finally:
        manager.disconnect(ws)

from .metrics import current_metrics

@app.get("/api/metrics")
async def api_metrics():
    return current_metrics()

async def broadcast_metrics_task():
    while True:
        await manager.broadcast({"type": "metrics", "data": current_metrics()})
        await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    task = asyncio.create_task(broadcast_metrics_task())
    try:
        yield
    finally:
        task.cancel()
        await db.close()
