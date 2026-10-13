#!/usr/bin/env bash
set -euo pipefail

# Build graph using OpenTripPlanner 2
OTP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${OTP_DIR}/../../data/out"

echo "=== Building OTP 2 Graph ==="
echo "GTFS source: ${DATA_DIR}/gtfs-jabodetabek.zip"
echo "Target dir: ${OTP_DIR}"

if [ ! -f "${DATA_DIR}/gtfs-jabodetabek.zip" ]; then
  echo "Error: ${DATA_DIR}/gtfs-jabodetabek.zip not found! Run pipeline first."
  exit 1
fi

cp "${DATA_DIR}/gtfs-jabodetabek.zip" "${OTP_DIR}/"

docker run --rm \
  -v "${OTP_DIR}:/var/opentripplanner" \
  -e JAVA_OPTS="-Xmx6G -Xms2G" \
  opentripplanner/opentripplanner:2.5.0 \
  --build --save /var/opentripplanner

echo "Graph build completed successfully."
