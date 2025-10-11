"""
Data models for the Server Shepherd application
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class LogLevel(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class LogEntry(BaseModel):
    id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    level: LogLevel
    message: str
    server: str
    service: str
    user_id: Optional[str] = "system"

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ServerMetrics(BaseModel):
    cpu: float = 0.0
    memory: float = 0.0
    disk: float = 0.0
    network: float = 0.0
    uptime: str = "0 days, 0 hours"
    total_logs: int = 0
    error_count: int = 0
    warning_count: int = 0
    info_count: int = 0
    critical_count: int = 0
    last_updated: datetime = Field(default_factory=datetime.now)

class GameState(BaseModel):
    user_id: str
    score: int = 0
    level: int = 0
    level_name: str = "Log Wrangler"
    badges: List[str] = []
    next_badge: str = "Warning Specialist"
    progress_to_next: int = 0
    total_logs_handled: int = 0
    streak: int = 0
    last_activity: datetime = Field(default_factory=datetime.now)

class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    score: int
    level: int
    badges_count: int = 0
