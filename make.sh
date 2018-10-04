#!/bin/sh

rm -f main.js
browserify -e app/main.js -o main.js
