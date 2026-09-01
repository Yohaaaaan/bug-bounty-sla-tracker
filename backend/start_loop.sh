#!/bin/bash
while true; do
  node src/server.js
  echo "Server crashed with exit code $?. Restarting in 1 second..."
  sleep 1
done
