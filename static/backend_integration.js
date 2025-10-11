(() => {
  const wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  let ws;

  function connectWS() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

    ws = new WebSocket(wsUrl);

    window.ws = ws;

    ws.onopen = () => {
      console.log('[WS] connected');
    };

    // Inside ws.onmessage handler in backend_integration.js
    ws.onmessage = function(event) {
        const msg = JSON.parse(event.data);

        if (msg.type === 'log' && msg.data) {
        const log = msg.data;

        // 1) Update your activity feed with real data
        if (window.addLogEntry) {
      // Expected signature: addLogEntry({id, timestamp, level, message, server, service})
      window.addLogEntry({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        server: log.server,
        service: log.service
      });
        } else if (window.displayLogsFromBackend) {
        // Alternative: directly re-use any existing renderer
        window.displayLogsFromBackend([log]);
        }

        // 2) Trigger the existing sheep animation pipeline
        if (typeof window.simulateLog === 'function') {
        window.simulateLog(log.level);
        } else if (typeof window.createSheep === 'function') {
        // If you have a direct creator, feed the actual log
        const sheep = window.createSheep(log);
        if (window.sheep && Array.isArray(window.sheep)) {
        window.sheep.push(sheep);
        }
        // If you need to kick animation loop, call your existing tick/start function
        if (typeof window.startSheepAnimation === 'function') {
        window.startSheepAnimation();
      }
    }

    // 3) Update counters/score if you have helpers
    if (window.updateGameState) {
      window.updateGameState(log.level);
    }
    if (window.updateTotalLogsCounter && window.gameState) {
      window.gameState.totalLogs = (window.gameState.totalLogs || 0) + 1;
      window.updateTotalLogsCounter();
    }
    if ((log.level === 'ERROR' || log.level === 'CRITICAL') &&
        window.updateErrorCounterDisplay && window.appData) {
      window.appData.serverMetrics.errorCounter += 1;
      window.updateErrorCounterDisplay();
    }
    }

    if (msg.type === 'metrics' && msg.data) {
    // existing metrics update logic...
    }

    if (msg.type === 'initial_logs' && Array.isArray(msg.data)) {
    // render recent logs at connect time
        if (window.displayLogsFromBackend) {
      window.displayLogsFromBackend(msg.data);
        } else if (window.addLogEntry) {
      msg.data.forEach(l => window.addLogEntry(l));
        }
    }
    };


    ws.onclose = () => {
      console.warn('[WS] closed; retrying in 2s');
      setTimeout(connectWS, 2000);
    };
    ws.onerror = (e) => console.error('[WS] error', e);
  }

  // Expose a helper to ask backend to simulate a specific level
window.simulateBackendLog = function(level) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'simulate', level }));
  }
};


  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectWS);
  } else {
    connectWS();
  }
})();
