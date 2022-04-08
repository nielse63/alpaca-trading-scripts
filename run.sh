#!/usr/bin/env bash
set -e

root=$(pwd)
if [ -d "$HOME/alpaca-trading-scripts" ]; then
  root="$HOME/alpaca-trading-scripts"
fi

cd "$root"
npm start
