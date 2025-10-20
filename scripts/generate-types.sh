#!/bin/bash

# Supabase Types Generator Script
# This script helps regenerate TypeScript types from your Supabase database

echo "🔧 Supabase Types Generator"
echo "=========================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we have a project ID
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL environment variable not set"
    echo "   Please set it in your .env.local file"
    exit 1
fi

# Extract project ID from URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not extract project ID from NEXT_PUBLIC_SUPABASE_URL"
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"
echo "🔄 Generating types..."

# Generate types
supabase gen types typescript --project-id $PROJECT_ID > types/supabase.ts

if [ $? -eq 0 ]; then
    echo "✅ Types generated successfully!"
    echo "📁 Updated: types/supabase.ts"
    echo ""
    echo "💡 Tip: Run this script whenever you update your database schema"
else
    echo "❌ Failed to generate types"
    echo "💡 Make sure your Supabase project is accessible and your API keys are correct"
    exit 1
fi
