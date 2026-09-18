#!/usr/bin/env bash
# Build script for Render (or any platform that runs a shell build step).
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
