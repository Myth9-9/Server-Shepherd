# app/db.py
import aiosqlite
from pathlib import Path

DB_PATH = Path("server_shepherd.db")
INIT_SQL = """
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  server TEXT NOT NULL,
  service TEXT NOT NULL,
  user_id TEXT DEFAULT 'system'
);
"""

class DB:
    def __init__(self, path: str | None = None):
        self.path = str(path or DB_PATH)
        self._conn: aiosqlite.Connection | None = None

    async def connect(self):
        self._conn = await aiosqlite.connect(self.path)
        await self._conn.execute("PRAGMA journal_mode=WAL;")
        await self._conn.execute(INIT_SQL)
        await self._conn.commit()

    async def close(self):
        if self._conn:
            await self._conn.close()

    async def insert_log(self, ts, level, message, server, service, user_id="system") -> int:
        cur = await self._conn.execute(
            "INSERT INTO logs (timestamp, level, message, server, service, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            (ts, level, message, server, service, user_id),
        )
        await self._conn.commit()
        return cur.lastrowid

    async def recent_logs(self, limit: int = 50) -> list[dict]:
        self._conn.row_factory = aiosqlite.Row
        cur = await self._conn.execute(
            "SELECT id, timestamp, level, message, server, service, user_id FROM logs ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        rows = await cur.fetchall()
        return [dict(r) for r in rows]
