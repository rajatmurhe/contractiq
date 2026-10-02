#!/usr/bin/env python3
"""
ContractIQ v2 — Render 24/7 Keep-Alive Background Service
Runs a lightweight HTTP server on $PORT to satisfy Render web service health checks
and pings all ContractIQ endpoints every 5 minutes in a background thread to prevent sleep mode.
"""

import os
import sys
import time
import threading
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler

ENDPOINTS = [
    os.getenv("FRONTEND_URL", "https://contractiq-frontend.onrender.com"),
    os.getenv("GATEWAY_URL", "https://contractiq-gateway.onrender.com/health/live"),
    os.getenv("AGENT_URL", "https://contractiq-agent-service.onrender.com/health/live"),
    os.getenv("MCP_URL", "https://contractiq-mcp-server.onrender.com/health/live"),
]

def ping_services():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Executing 24/7 Keep-Alive Ping...")
    for url in ENDPOINTS:
        try:
            req = urllib.request.Request(
                url, 
                headers={"User-Agent": "ContractIQ-KeepAlive/2.0"}
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                print(f"  ✓ {url} -> HTTP {resp.status}")
        except urllib.error.HTTPError as e:
            print(f"  ⚠ {url} -> HTTP {e.code}")
        except Exception as e:
            print(f"  ✗ {url} -> {e}")

def start_ping_loop():
    # Initial delay before starting loop
    time.sleep(10)
    while True:
        ping_services()
        time.sleep(300) # Ping every 5 minutes

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK - 24/7 KeepAlive Service Active")

    def log_message(self, format, *args):
        return # Suppress verbose access logs

if __name__ == "__main__":
    # Start background ping thread
    pinger = threading.Thread(target=start_ping_loop, daemon=True)
    pinger.start()

    # Start HTTP server for Render web service health checks
    port = int(os.getenv("PORT", "8080"))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    print(f"ContractIQ Keep-Alive Service listening on 0.0.0.0:{port}...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
