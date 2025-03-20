#!/bin/bash

# Check if .env.example exists
if [ ! -f .env.example ]; then
    echo "❌ .env.example file not found!"
    exit 1
fi

# Create .env.local with development environment
cat .env.example | sed 's/<test|development|production>/development/' > .env.local
echo "✅ Created .env.local with development environment"

# Create .env.test with test environment
cat .env.example | sed 's/<test|development|production>/test/' > .env.test
echo "✅ Created .env.test with test environment"