// Server Shepherd Dashboard JavaScript

// Application data
let appData = {
    serverMetrics: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        uptime: "0 days, 0 hours",
        totalLogs: 0,
        errorCounter: 0
    },
    sampleLogs: [
        {id: 1, timestamp: "2025-10-06T12:22:15Z", level: "INFO", message: "User authentication successful", server: "web-01", service: "auth-service"},
        {id: 2, timestamp: "2025-10-06T12:22:18Z", level: "WARNING", message: "High memory usage detected", server: "app-02", service: "main-app"},
        {id: 3, timestamp: "2025-10-06T12:22:22Z", level: "ERROR", message: "Database connection timeout", server: "db-01", service: "postgres"},
        {id: 4, timestamp: "2025-10-06T12:22:25Z", level: "INFO", message: "Backup process completed", server: "backup-01", service: "backup-service"}
    ],
    gamificationData: {
        currentScore: 0,
        level: 0,
        levelName: "Log Wrangler",
        badges: ["Shepherd Novice", "First Alert", "Error Handler"],
        nextBadge: "Warning Specialist",
        progressToNext: 65,
        leaderboard: [
            {name: "Jon Jones", score: 4521, level: 12},
            {name: "Jennie Kim", score: 3892, level: 10},
            {name: "Current User", score: 0, level: 0},
            {name: "Dale Steyn", score: 2103, level: 7},
            {name: "Alex Pereira", score: 1876, level: 6}
        ]
    },
    logTypes: {
        INFO: {color: "#ffffff", points: 10, speed: 0.5, size: 20},
        WARNING: {color: "#ffd700", points: 20, speed: 0.7, size: 25},
        ERROR: {color: "#ff6b35", points: 50, speed: 0.9, size: 30},
        CRITICAL: {color: "#dc3545", points: 100, speed: 1.2, size: 35}
    }
};

// Global state
let sheep = [];
let autoModeInterval = null;
let logCounter = 0;
let gameState = {
    score: appData.gamificationData.currentScore,
    level: appData.gamificationData.level,
    levelName: appData.gamificationData.levelName,
    badges: [...appData.gamificationData.badges],
    totalLogs: appData.serverMetrics.totalLogs
};

// Sample log messages for different types
const logMessages = {
    INFO: [
        "User login successful",
        "Backup process completed",
        "Cache refreshed",
        "Session started",
        "File uploaded successfully",
        "User logout detected",
        "Health check passed"
    ],
    WARNING: [
        "High memory usage detected",
        "Slow query performance",
        "Connection pool nearly full",
        "Disk space running low",
        "Rate limit approaching",
        "Certificate expires soon",
        "High CPU usage"
    ],
    ERROR: [
        "Database connection failed",
        "Authentication timeout",
        "File not found",
        "Network connection lost",
        "Service unavailable",
        "Permission denied",
        "Invalid request format"
    ],
    CRITICAL: [
        "System crash detected",
        "Security breach attempt",
        "Complete service failure",
        "Data corruption detected",
        "Memory leak critical",
        "Emergency shutdown triggered",
        "System resource exhausted"
    ]
};

const servers = ["web-01", "web-02", "app-01", "app-02", "db-01", "db-02", "backup-01", "cache-01"];
const services = ["auth-service", "main-app", "postgres", "redis", "nginx", "backup-service", "api-gateway", "scheduler"];

// Initialize the dashboard
function initDashboard() {
    displayLeaderboard();
    displayInitialLogs();
    startAutoUpdates();
    
    // Add some initial sheep
    setTimeout(() => {
        simulateLog('INFO');
        setTimeout(() => simulateLog('WARNING'), 1000);
        setTimeout(() => simulateLog('ERROR'), 2000);
    }, 500);
}

// Display leaderboard
function displayLeaderboard() {
    const leaderboardEl = document.getElementById('leaderboard');
    const leaderboard = appData.gamificationData.leaderboard;
    
    leaderboardEl.innerHTML = leaderboard.map((entry, index) => `
        <div class="leaderboard-entry ${entry.name === 'Current User' ? 'current-user' : ''}">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${entry.name}</span>
            <div>
                <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
                <span class="leaderboard-level">Lv${entry.level}</span>
            </div>
        </div>
    `).join('');
}

// Display initial log entries
function displayInitialLogs() {
    const logEntriesEl = document.getElementById('logEntries');
    const initialLogs = [...appData.sampleLogs].reverse(); // Show newest first
    
    logEntriesEl.innerHTML = initialLogs.map(log => createLogEntryHTML(log)).join('');
}

// Create HTML for a log entry
function createLogEntryHTML(log) {
    const time = new Date(log.timestamp).toLocaleTimeString();
    return `
        <div class="log-entry ${log.level.toLowerCase()}">
            <div class="log-header">
                <span class="log-level ${log.level.toLowerCase()}">${log.level}</span>
                <span class="log-time">${time}</span>
            </div>
            <div class="log-message">${log.message}</div>
            <div class="log-details">
                ${log.server} • ${log.service}
            </div>
        </div>
    `;
}

// Add new log entry to the feed
function addLogEntry(log) {
    const logEntriesEl = document.getElementById('logEntries');
    const newLogHTML = createLogEntryHTML(log);
    
    logEntriesEl.insertAdjacentHTML('afterbegin', newLogHTML);
    
    // Remove old entries if there are more than 20
    const entries = logEntriesEl.children;
    while (entries.length > 20) {
        entries[entries.length - 1].remove();
    }
}

// Create a sheep element
function createSheep(logData) {
    const sheepField = document.getElementById('sheepField');
    const fieldRect = sheepField.getBoundingClientRect();

    const sheepObj = {
        id: `sheep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        element: document.createElement('div'),
        logData: logData,
        x: -50,
        y: Math.random() * (fieldRect.height - 50),
        speed: appData.logTypes[logData.level].speed,
        level: logData.level,
        lifetime: 0,
        acknowledged: false // Track if acknowledged
    };

    sheepObj.element.className = `sheep ${logData.level.toLowerCase()}`;
    sheepObj.element.innerHTML = '🐑';
    sheepObj.element.style.left = sheepObj.x + 'px';
    sheepObj.element.style.top = sheepObj.y + 'px';
    sheepObj.element.style.fontSize = appData.logTypes[logData.level].size + 'px';
    sheepObj.element.id = sheepObj.id;
    sheepObj.element.style.cursor = 'pointer';

    // Add click and hover handlers for tooltip and acknowledge
    sheepObj.element.addEventListener('click', (e) => {
        e.stopPropagation();
        showSheepLogModal(sheepObj, e);
    });

    sheepObj.element.addEventListener('mouseenter', (e) => {
        showTooltip(e, logData);
    });

    sheepObj.element.addEventListener('mouseleave', () => {
        setTimeout(hideTooltip, 100); // Small delay to allow moving to tooltip
    });

    sheepField.appendChild(sheepObj.element);
    return sheepObj;
}

// Show a modal for sheep log details and acknowledge action
function showSheepLogModal(sheepObj, event) {
    // Remove any existing modal
    let existingModal = document.getElementById('sheepLogModal');
    if (existingModal) existingModal.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'sheepLogModal';
    modal.className = 'sheep-log-modal';

    // Modal content
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${sheepObj.logData.level} Log Details</h3>
            <p><strong>Time:</strong> ${new Date(sheepObj.logData.timestamp).toLocaleString()}</p>
            <p><strong>Message:</strong> ${sheepObj.logData.message}</p>
            <p><strong>Server:</strong> ${sheepObj.logData.server}</p>
            <p><strong>Service:</strong> ${sheepObj.logData.service}</p>
            <button class="btn btn--primary" id="acknowledgeBtn" ${sheepObj.acknowledged ? 'disabled' : ''}>
                ${sheepObj.acknowledged ? 'Acknowledged' : 'Acknowledge'}
            </button>
            <button class="btn btn--secondary" id="closeModalBtn">Close</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Center modal
    modal.style.top = `${window.innerHeight / 2 - modal.offsetHeight / 2}px`;
    modal.style.left = `${window.innerWidth / 2 - modal.offsetWidth / 2}px`;

    // Close modal logic
    document.getElementById('closeModalBtn').onclick = () => modal.remove();

    // Acknowledge logic
    document.getElementById('acknowledgeBtn').onclick = () => {
        sheepObj.acknowledged = true;
        sheepObj.element.classList.add('acknowledged');
        document.getElementById('acknowledgeBtn').textContent = 'Acknowledged';
        document.getElementById('acknowledgeBtn').disabled = true;
    };

    // Remove modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Show tooltip
function showTooltip(event, logData) {
    const tooltip = document.getElementById('tooltip');
    const time = new Date(logData.timestamp).toLocaleTimeString();
    
    // Update tooltip content
    tooltip.querySelector('.tooltip-level').textContent = logData.level;
    tooltip.querySelector('.tooltip-level').className = `tooltip-level ${logData.level.toLowerCase()}`;
    tooltip.querySelector('.tooltip-time').textContent = time;
    tooltip.querySelector('.tooltip-message').textContent = logData.message;
    tooltip.querySelector('.server-name').textContent = logData.server;
    tooltip.querySelector('.service-name').textContent = logData.service;
    
    // Position tooltip near the sheep
    const rect = event.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 10;
    
    // Adjust if tooltip would go off screen
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
        top = rect.bottom + 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.classList.remove('hidden');
    
    // Keep tooltip visible longer when hovering
    tooltip.addEventListener('mouseenter', () => {
        clearTimeout(tooltip.hideTimeout);
    });
    
    tooltip.addEventListener('mouseleave', hideTooltip);
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.hideTimeout = setTimeout(() => {
        tooltip.classList.add('hidden');
    }, 200);
}

// Animate sheep
function animateSheep() {
    const sheepField = document.getElementById('sheepField');
    const fieldWidth = sheepField.offsetWidth;
    
    sheep.forEach((sheepObj, index) => {
        sheepObj.lifetime++;
        sheepObj.x += sheepObj.speed;
        sheepObj.element.style.left = sheepObj.x + 'px';
        
        // Remove sheep that have moved off screen or lived too long
        if (sheepObj.x > fieldWidth + 50 || sheepObj.lifetime > 1500) {
            sheepObj.element.classList.add('fading');
            setTimeout(() => {
                if (sheepObj.element.parentNode) {
                    sheepObj.element.parentNode.removeChild(sheepObj.element);
                }
            }, 1000);
            sheep.splice(index, 1);
        }
    });
    
    // Limit the number of sheep on screen
    if (sheep.length > 30) {
        const oldestSheep = sheep.shift();
        if (oldestSheep.element.parentNode) {
            oldestSheep.element.classList.add('fading');
            setTimeout(() => {
                if (oldestSheep.element.parentNode) {
                    oldestSheep.element.parentNode.removeChild(oldestSheep.element);
                }
            }, 1000);
        }
    }
    
    requestAnimationFrame(animateSheep);
}

// Generate a log entry
function generateLogData(level) {
    logCounter++;
    const messages = logMessages[level];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const server = servers[Math.floor(Math.random() * servers.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    
    return {
        id: logCounter,
        timestamp: new Date().toISOString(),
        level: level,
        message: message,
        server: server,
        service: service
    };
}

// Simulate a log entry
function simulateLog(level) {
    const logData = generateLogData(level);

    // Create sheep
    const newSheep = createSheep(logData);
    sheep.push(newSheep);

    // Add to log feed
    addLogEntry(logData);

    // Update gamification
    updateGameState(level);

    // Update total logs counter
    gameState.totalLogs++;
    updateTotalLogsCounter();

    // Increment error counter for ERROR or CRITICAL logs
    if (level === 'ERROR' || level === 'CRITICAL') {
        appData.serverMetrics.errorCounter++;
        updateErrorCounterDisplay();
    }
}

// Update error counter display
function updateErrorCounterDisplay() {
    const errorCounterEl = document.getElementById('errorCounter');
    if (errorCounterEl) {
        errorCounterEl.textContent = appData.serverMetrics.errorCounter;
    }
}

// Update game state
function updateGameState(logLevel) {
    const points = appData.logTypes[logLevel].points;
    gameState.score += points;
    
    // Update score display with animation
    animateCounter('currentScore', gameState.score);
    
    // Check for level up
    const newLevel = Math.floor(gameState.score / 500) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.levelName = getLevelName(newLevel);
        updateLevelDisplay();
        checkBadges();
    }
    
    // Update leaderboard position
    updateLeaderboardPosition();
}

// Get level name based on level number
function getLevelName(level) {
    const levelNames = [
        "Shepherd Novice", "Log Apprentice", "Data Watcher", "Alert Guardian",
        "System Monitor", "Error Hunter", "Warning Specialist", "Log Wrangler",
        "Data Shepherd", "Alert Master", "System Guardian", "Log Commander",
        "Data Overlord", "Ultimate Shepherd"
    ];
    
    return levelNames[Math.min(level - 1, levelNames.length - 1)] || "Ultimate Shepherd";
}

// Update level display
function updateLevelDisplay() {
    document.getElementById('currentLevel').textContent = `Level ${gameState.level}`;
    document.getElementById('levelName').textContent = gameState.levelName;
    
    // Add a brief highlight effect
    const levelDisplay = document.querySelector('.level-display');
    levelDisplay.style.transform = 'scale(1.05)';
    levelDisplay.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
        levelDisplay.style.transform = 'scale(1)';
    }, 300);
}

// Check for new badges
function checkBadges() {
    const badgeConditions = {
        "Shepherd Novice": () => gameState.score >= 100,
        "First Alert": () => gameState.score >= 500,
        "Error Handler": () => gameState.score >= 1000,
        "Warning Specialist": () => gameState.score >= 3000,
        "Error Master": () => gameState.score >= 5000,
        "Alert Veteran": () => gameState.score >= 7500,
        "System Guardian": () => gameState.score >= 10000
    };
    
    Object.keys(badgeConditions).forEach(badgeName => {
        if (!gameState.badges.includes(badgeName) && badgeConditions[badgeName]()) {
            gameState.badges.push(badgeName);
            unlockBadge(badgeName);
        }
    });
}

// Unlock a new badge with animation
function unlockBadge(badgeName) {
    const badgesGrid = document.getElementById('badgesGrid');
    const newBadgeEl = document.createElement('div');
    newBadgeEl.className = 'badge earned';
    newBadgeEl.textContent = `⭐ ${badgeName}`;
    newBadgeEl.style.transform = 'scale(0)';
    newBadgeEl.style.transition = 'transform 0.5s ease';
    
    badgesGrid.appendChild(newBadgeEl);
    
    setTimeout(() => {
        newBadgeEl.style.transform = 'scale(1)';
    }, 100);
    
    // Remove locked badge if it exists
    const lockedBadges = badgesGrid.querySelectorAll('.badge.locked');
    lockedBadges.forEach(badge => {
        if (badge.textContent.includes(badgeName)) {
            badge.remove();
        }
    });
}

// Update leaderboard position
function updateLeaderboardPosition() {
    const leaderboard = appData.gamificationData.leaderboard;
    const currentUserIndex = leaderboard.findIndex(entry => entry.name === 'Current User');
    
    if (currentUserIndex !== -1) {
        leaderboard[currentUserIndex].score = gameState.score;
        leaderboard[currentUserIndex].level = gameState.level;
        
        // Sort leaderboard by score
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Redisplay leaderboard
        displayLeaderboard();
    }
}

// Animate counter
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent.replace(/,/g, ''));
    const increment = Math.ceil((targetValue - currentValue) / 20);
    
    if (currentValue < targetValue) {
        element.textContent = Math.min(currentValue + increment, targetValue).toLocaleString();
        setTimeout(() => animateCounter(elementId, targetValue), 50);
    }
}

// Update total logs counter
function updateTotalLogsCounter() {
    animateCounter('totalLogs', gameState.totalLogs);
}

// Toggle auto mode
function toggleAutoMode() {
    const autoModeCheckbox = document.getElementById('autoMode');
    
    if (autoModeCheckbox.checked) {
        // Start auto mode
        autoModeInterval = setInterval(() => {
            const logTypes = ['INFO', 'INFO', 'INFO', 'WARNING', 'WARNING', 'ERROR', 'CRITICAL'];
            const randomType = logTypes[Math.floor(Math.random() * logTypes.length)];
            simulateLog(randomType);
        }, 3000); // Generate a log every 3 seconds
    } else {
        // Stop auto mode
        if (autoModeInterval) {
            clearInterval(autoModeInterval);
            autoModeInterval = null;
        }
    }
}

// Start automatic updates for metrics
function startAutoUpdates() {
    setInterval(() => {
        // Slightly vary the metrics to simulate real activity
        const metricsEl = document.querySelectorAll('.progress-fill');
        metricsEl.forEach(el => {
            const currentProgress = parseInt(el.dataset.progress);
            const variation = Math.random() * 10 - 5; // ±5%
            const newProgress = Math.max(0, Math.min(100, currentProgress + variation));
            el.style.width = newProgress + '%';
            el.dataset.progress = newProgress;
            
            // Update the corresponding value display
            const metricValue = el.parentElement.parentElement.querySelector('.metric-value');
            if (metricValue) {
                metricValue.textContent = Math.round(newProgress) + '%';
            }
        });
    }, 5000); // Update every 5 seconds
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    animateSheep();

    // Initialize error counter display
    updateErrorCounterDisplay();

    // Hide tooltip when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sheep') && !e.target.closest('.tooltip')) {
            hideTooltip();
        }
    });
});

// Make functions globally accessible
window.simulateLog = simulateLog;
window.toggleAutoMode = toggleAutoMode;