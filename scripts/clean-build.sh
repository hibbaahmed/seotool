#!/bin/bash

# Clean Next.js build script
echo "🧹 Cleaning Next.js build cache..."

# Remove build cache
rm -rf .next

# Remove node modules cache (optional)
# rm -rf node_modules/.cache

echo "✅ Build cache cleaned successfully!"
echo "🚀 Run 'npm run build' to rebuild"
