#!/usr/bin/env python3
"""
Gmail Send As and Filter Automation
Automates adding Send As addresses and creating filters for all domains
"""
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def setup_driver():
    """Setup Chrome driver"""
    chrome_options = Options()
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--start-maximized')
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def gmail_setup_automation():
    """Automate Gmail Send As and Filter setup"""
    print("🚀 Starting Gmail automation for all domains...")
    
    with open("expanded_gmail_config.json", "r") as f:
        config = json.load(f)
    
    driver = setup_driver()
    
    try:
        # Navigate to Gmail
        print("🌐 Opening Gmail...")
        driver.get("https://mail.google.com")
        
        # Manual intervention for login
        input("\n🔐 Please log into Gmail manually, then press Enter to continue...")
        
        # Navigate to settings
        print("⚙️ Opening Gmail Settings...")
        driver.get("https://mail.google.com/mail/u/0/#settings/accounts")
        time.sleep(3)
        
        print("\n📧 Add the following Send As addresses manually:")
        for i, send_as in enumerate(config['send_as'], 1):
            print(f"   {i}. {send_as['sendAsEmail']} ({send_as['displayName']})")
        
        print("\n🔧 SMTP Settings for all addresses:")
        print("   • SMTP Server: smtp.gmail.com")
        print("   • Port: 587") 
        print("   • Username: aegntic@gmail.com")
        print("   • Password: AEp@ssWrd11:11")
        print("   • Security: TLS/STARTTLS")
        
        input("\nPress Enter after adding all Send As addresses...")
        
        # Navigate to filters
        print("🏷️ Setting up filters...")
        driver.get("https://mail.google.com/mail/u/0/#settings/filters")
        time.sleep(2)
        
        print("\n🔍 Create these filters manually:")
        for domain_config in config['domains']:
            domain = domain_config['domain']
            email = domain_config['email']
            print(f"   • Filter: to:{email} → Label: Domain-{domain}")
        
        input("\nPress Enter after creating all filters...")
        
        print("\n✅ Gmail automation guidance complete!")
        print("🎯 All Send As addresses and filters should now be configured.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        input("Press Enter to close browser...")
        driver.quit()

if __name__ == "__main__":
    gmail_setup_automation()
