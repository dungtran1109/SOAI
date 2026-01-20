#!/bin/sh

echo "================ START FRONTEND (DEV) ==================="
set -e

echo "[INFO] Start shell-app (port 5173)"
(
	cd shell-app
	npm install
	npm run dev
) &

echo "[INFO] Start recruitment-app (port 5174)"
(
	cd ../recruitment-app
	npm install
	npm run dev -- --port 5174
) &

wait
echo "================ END FRONTEND (DEV) ==================="