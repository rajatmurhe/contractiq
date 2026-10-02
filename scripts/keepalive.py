#!/usr/bin/env font python3
"""
ContractIQ v2 — Render 24/7 Keep-Alive Cron Script
Prevents Render free tier services from spinning down after 15 minutes of inactivity.
"""

import os
import sys
import time
import urllib.request
import urllib.error

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

if __name__ == "__main__":
    ping_services()
