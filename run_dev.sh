#!/bin/bash

echo "Starting backend server..."
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
echo "Frontend server started with PID: $FRONTEND_PID"

echo ""
echo "Both servers are running in the background."
echo "To stop the backend server, run: kill $BACKEND_PID"
echo "To stop the frontend server, run: kill $FRONTEND_PID"
