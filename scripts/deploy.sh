#!/usr/bin/env bash
set -e
if [ ! -d /var/www/vanuarai/.git ]; then
  rm -rf /var/www/vanuarai
  git clone https://darkhorsefiji:__GIT_TOKEN__@github.com/darkhorsefiji/vanuarai.git /var/www/vanuarai
fi
cd /var/www/vanuarai
git remote set-url origin https://darkhorsefiji:__GIT_TOKEN__@github.com/darkhorsefiji/vanuarai.git
git pull origin main
npm ci
npm ci --prefix web
npm run build
pm2 start ecosystem.config.js
pm2 save
