# app/metrics.py
import psutil
from time import time

_last_net = None
_last_t = None

def current_metrics() -> dict:
    global _last_net, _last_t
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory().percent
    disk = psutil.disk_usage("/").percent
    now = time()
    net = psutil.net_io_counters()
    if _last_net is None:
        network = 0.0
    else:
        delta = (net.bytes_sent + net.bytes_recv) - (_last_net.bytes_sent + _last_net.bytes_recv)
        dt = max(0.001, now - _last_t)
        network = min(100.0, (delta / dt) / (1024 * 50))
    _last_net, _last_t = net, now
    return {"cpu": round(cpu,1), "memory": round(mem,1), "disk": round(disk,1), "network": round(network,1)}
