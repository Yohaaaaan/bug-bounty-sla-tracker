#!/bin/bash
while true; do
  npx -y localtunnel --port 3000
  echo "Localtunnel dropped. Restarting in 2 seconds..."
  sleep 2
done
