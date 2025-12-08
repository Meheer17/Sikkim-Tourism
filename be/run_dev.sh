#!/bin/bash
# Development server script
# This binds to 0.0.0.0 so it's accessible from mobile devices
source venv/bin/activate
echo "🚀 Starting FastAPI backend..."
echo "📱 Accessible from:"
echo "   - localhost: http://localhost:8000"
echo "   - Network: http://192.168.0.104:8000"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
