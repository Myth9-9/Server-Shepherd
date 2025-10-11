# Server-Shepherd
Gamified Server Log Monitoring Dashboard

Step 1- Create a Python virtual environment

macOS/Linux:

python3 -m venv venv

source venv/bin/activate

Windows (PowerShell):

py -3 -m venv venv

venv\Scripts\Activate

Step 2- Add dependencies

Install: pip install -r requirements.txt

Step 3- Run the backend

From the project root (server_shepherd/):

uvicorn app.main:app --reload --port 8000

Quick checks:

GET http://localhost:8000/api/health returns {"status":"ok"}.

WebSocket connects (check DevTools Console for [WS] connected).
