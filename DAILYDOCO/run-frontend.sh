#!/bin/bash

echo "🚀 DailyDoco Pro Frontend Launcher"
echo "=================================="
echo ""
echo "Available versions:"
echo "1) Modern SaaS (c1v1) - Clean, minimal, Stripe/Linear inspired"
echo "2) Enterprise Premium (c2v1) - Data-rich, Datadog/Snowflake inspired"
echo "3) AI-First Futuristic (c3v1) - Cutting-edge, Anthropic/OpenAI inspired"
echo ""

read -p "Which version would you like to run? (1/2/3): " choice

case $choice in
    1)
        echo "Starting Modern SaaS version..."
        cd c1v1-modern-saas && ./run.sh
        ;;
    2)
        echo "Starting Enterprise Premium version..."
        cd c2v1-enterprise-premium && ./run.sh
        ;;
    3)
        echo "Starting AI-First Futuristic version..."
        cd c3v1-ai-futuristic && ./run.sh
        ;;
    *)
        echo "Invalid choice. Please run again and select 1, 2, or 3."
        exit 1
        ;;
esac