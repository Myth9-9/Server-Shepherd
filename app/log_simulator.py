import random, datetime

SERVERS = ["web-01", "web-02", "app-01", "app-02", "db-01", "db-02", "backup-01", "cache-01"]
SERVICES = ["auth-service", "main-app", "postgres", "redis", "nginx", "backup-service", "api-gateway", "scheduler"]
MESSAGES = {
    "INFO": [
        "User login successful", "Backup process completed", "Cache refreshed",
        "Session started", "File uploaded successfully", "User logout detected", "Health check passed"
    ],
    "WARNING": [
        "High memory usage detected", "Slow query performance", "Connection pool nearly full",
        "Disk space running low", "Rate limit approaching", "Certificate expires soon", "High CPU usage"
    ],
    "ERROR": [
        "Database connection failed", "Authentication timeout", "File not found",
        "Network connection lost", "Service unavailable", "Permission denied", "Invalid request format"
    ],
    "CRITICAL": [
        "System crash detected", "Security breach attempt", "Complete service failure",
        "Data corruption detected", "Memory leak critical", "Emergency shutdown triggered", "System resource exhausted"
    ],
}

POINTS = {"INFO": 1, "WARNING": 2, "ERROR": 5, "CRITICAL": 10}

_counter = 0

def generate_log(level: str = None):
    global _counter
    _counter += 1
    lvl = level if level in MESSAGES else random.choice(list(MESSAGES.keys()))
    return {
        "id": _counter,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "level": lvl,
        "message": random.choice(MESSAGES[lvl]),
        "server": random.choice(SERVERS),
        "service": random.choice(SERVICES),
        "points": POINTS[lvl]
    }
