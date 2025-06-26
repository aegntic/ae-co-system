#!/usr/bin/env python3
"""
Streamlined Gmail Browser Automation
Using Chrome in remote debugging mode for Gmail Send As setup
"""
import time
import json
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

def get_free_port():
    """Find a free port for Chrome remote debugging"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

def start_chrome_session():
    """Start Chrome with remote debugging"""
    port = get_free_port()
    print(f"🚀 Starting Chrome on port {port}")
    
    # Start Chrome with remote debugging
    chrome_cmd = [
        'google-chrome', 
        '--new-window',
        '--remote-debugging-port=' + str(port),
        '--user-data-dir=/tmp/gmail-automation-chrome',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        'https://mail.google.com'
    ]
    
    subprocess.Popen(chrome_cmd)
    time.sleep(3)  # Wait for Chrome to start
    return port

def create_driver(port):
    """Create Selenium driver connected to existing Chrome instance"""
    chrome_options = Options()
    chrome_options.add_experimental_option("debuggerAddress", f"127.0.0.1:{port}")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"❌ Failed to connect to Chrome: {e}")
        return None

def main():
    """Main Gmail automation"""
    print("🔧 Gmail Send As Configuration Automation")
    print("=" * 50)
    
    # Load configuration
    try:
        with open("gmail_automation_config.json", "r") as f:
            config = json.load(f)
    except FileNotFoundError:
        print("❌ Configuration file not found")
        return
    
    # Start Chrome and connect
    port = start_chrome_session()
    driver = create_driver(port)
    
    if not driver:
        print("❌ Failed to initialize browser")
        return
    
    try:
        print("🌐 Connected to Gmail...")
        
        # Simple approach: just navigate to accounts settings
        print("🔄 Opening Gmail Settings...")
        driver.get("https://mail.google.com/mail/u/0/#settings/accounts")
        time.sleep(5)
        
        print("✅ Gmail Settings opened successfully!")
        print("\n📋 Next Steps (Manual completion required):")
        print("   1. Click 'Add another email address' in the 'Send mail as' section")
        print("   2. Add the following Send As addresses:")
        
        for send_as in config['send_as']:
            print(f"      • {send_as['sendAsEmail']} (Display: {send_as['displayName']})")
        
        print("\n   3. For SMTP settings, use:")
        print("      • SMTP Server: smtp.gmail.com")
        print("      • Port: 587")
        print("      • Username: aegntic@gmail.com")
        print("      • Password: AEp@ssWrd11:11")
        print("      • TLS: Yes")
        
        print("\n   4. Create filters in Filters tab:")
        for domain in config['domains']:
            print(f"      • Filter for '{domain['email']}' → Label: 'Domain-{domain['domain']}'")
        
        print("\n🎯 Browser will remain open for manual configuration...")
        input("Press Enter when you've completed the setup...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        print("🔚 Automation complete. Browser remains open for your use.")

if __name__ == "__main__":
    main()