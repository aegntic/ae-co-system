#!/bin/bash
echo "Opening Mattae Cooper Job Application..."
echo "Choose an option:"
echo "1. Open in default browser"
echo "2. Start local server (http://localhost:8080)"

read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "Opening in browser..."
        xdg-open application.html 2>/dev/null || open application.html 2>/dev/null || echo "Please manually open: $(pwd)/application.html"
        ;;
    2)
        echo "Starting local server at http://localhost:8080"
        echo "Press Ctrl+C to stop the server"
        python3 -m http.server 8080
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        ;;
esac