#!/usr/bin/env python3
"""
Complete Domain Email Automation Script
Automates DNS setup, Gmail Send As configuration, and filter creation for 12 domains
"""
import json
import time
import subprocess
import requests
from typing import List, Dict, Any

class DomainEmailAutomator:
    def __init__(self, config_file: str):
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        # Porkbun API credentials
        self.porkbun_api_key = "pk1_ea88ead2b57e5cd7589676eaf2fde771f63298136980ab1fc76de082299e2c7c"
        self.porkbun_secret = "sk1_1941858c3e7be7e75ae46727c26162731166589c6c295d9d070cc05685bbff5b"
        self.porkbun_base_url = "https://porkbun.com/api/json/v3"
        
        self.gmail_account = self.config['gmail_account']
        
    def setup_porkbun_email_forwarding(self) -> bool:
        """Set up email forwarding for all domains using Porkbun API"""
        print("🔧 Setting up Porkbun email forwarding...")
        
        success_count = 0
        for domain_config in self.config['domains']:
            domain = domain_config['domain']
            email = domain_config['email']
            
            print(f"📧 Setting up forwarding for {email} → {self.gmail_account}")
            
            try:
                # Get current forwards
                response = requests.post(
                    f"{self.porkbun_base_url}/email/retrieve/{domain}",
                    json={
                        "secretapikey": self.porkbun_secret,
                        "apikey": self.porkbun_api_key
                    }
                )
                
                if response.status_code == 200:
                    # Add email forward
                    forward_response = requests.post(
                        f"{self.porkbun_base_url}/email/addforward/{domain}",
                        json={
                            "secretapikey": self.porkbun_secret,
                            "apikey": self.porkbun_api_key,
                            "alias": email.split('@')[0],  # Get username part
                            "forward": self.gmail_account
                        }
                    )
                    
                    if forward_response.status_code == 200:
                        print(f"✅ Forwarding set up for {email}")
                        success_count += 1
                    else:
                        print(f"⚠️ Failed to set up forwarding for {email}: {forward_response.text}")
                else:
                    print(f"⚠️ Could not access domain {domain}: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error setting up {domain}: {e}")
                
            time.sleep(1)  # Rate limiting
        
        print(f"✅ Email forwarding setup complete: {success_count}/{len(self.config['domains'])} domains")
        return success_count > 0
    
    def setup_alternative_forwarding(self):
        """Set up alternative email forwarding using DNS records"""
        print("🔄 Setting up alternative email forwarding...")
        
        print("\n📋 Manual DNS Setup Instructions:")
        print("For each domain, add these DNS records:")
        print("\n**MX Records** (Priority 10):")
        print("- mx1.forwardemail.net")
        print("- mx2.forwardemail.net")
        
        print(f"\n**TXT Record**:")
        print(f"forward-email={self.gmail_account}")
        
        print("\n🔧 Automated DNS Record Commands:")
        for domain_config in self.config['domains']:
            domain = domain_config['domain']
            email = domain_config['email']
            username = email.split('@')[0]
            
            print(f"\n# {domain}")
            print(f"# Add MX records and TXT record: forward-email-{username}={self.gmail_account}")
    
    def create_gmail_automation_script(self):
        """Create a Chrome automation script for Gmail setup"""
        script_content = f'''#!/usr/bin/env python3
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
        input("\\n🔐 Please log into Gmail manually, then press Enter to continue...")
        
        # Navigate to settings
        print("⚙️ Opening Gmail Settings...")
        driver.get("https://mail.google.com/mail/u/0/#settings/accounts")
        time.sleep(3)
        
        print("\\n📧 Add the following Send As addresses manually:")
        for i, send_as in enumerate(config['send_as'], 1):
            print(f"   {{i}}. {{send_as['sendAsEmail']}} ({{send_as['displayName']}})")
        
        print("\\n🔧 SMTP Settings for all addresses:")
        print("   • SMTP Server: smtp.gmail.com")
        print("   • Port: 587") 
        print("   • Username: {self.gmail_account}")
        print("   • Password: AEp@ssWrd11:11")
        print("   • Security: TLS/STARTTLS")
        
        input("\\nPress Enter after adding all Send As addresses...")
        
        # Navigate to filters
        print("🏷️ Setting up filters...")
        driver.get("https://mail.google.com/mail/u/0/#settings/filters")
        time.sleep(2)
        
        print("\\n🔍 Create these filters manually:")
        for domain_config in config['domains']:
            domain = domain_config['domain']
            email = domain_config['email']
            print(f"   • Filter: to:{{email}} → Label: Domain-{{domain}}")
        
        input("\\nPress Enter after creating all filters...")
        
        print("\\n✅ Gmail automation guidance complete!")
        print("🎯 All Send As addresses and filters should now be configured.")
        
    except Exception as e:
        print(f"❌ Error: {{e}}")
    finally:
        input("Press Enter to close browser...")
        driver.quit()

if __name__ == "__main__":
    gmail_setup_automation()
'''
        
        with open("gmail_automation_script.py", "w") as f:
            f.write(script_content)
        
        print("✅ Gmail automation script created: gmail_automation_script.py")
    
    def create_verification_tracker(self):
        """Create a verification tracking system"""
        verification_data = {
            "domains": [],
            "verification_status": {
                "email_forwarding": {},
                "send_as_added": {},
                "send_as_verified": {},
                "filters_created": {}
            }
        }
        
        for domain_config in self.config['domains']:
            domain = domain_config['domain']
            email = domain_config['email']
            
            verification_data["domains"].append({
                "domain": domain,
                "email": email,
                "name": domain_config['name']
            })
            
            # Initialize status tracking
            verification_data["verification_status"]["email_forwarding"][domain] = False
            verification_data["verification_status"]["send_as_added"][domain] = False
            verification_data["verification_status"]["send_as_verified"][domain] = False
            verification_data["verification_status"]["filters_created"][domain] = False
        
        with open("verification_tracker.json", "w") as f:
            json.dump(verification_data, f, indent=2)
        
        print("✅ Verification tracker created: verification_tracker.json")
    
    def run_complete_automation(self):
        """Run the complete automation process"""
        print("🚀 STARTING COMPLETE DOMAIN EMAIL AUTOMATION")
        print("=" * 60)
        
        # Step 1: Try Porkbun API forwarding
        print("\\n🔧 STEP 1: Email Forwarding Setup")
        forwarding_success = self.setup_porkbun_email_forwarding()
        
        if not forwarding_success:
            print("⚠️ Porkbun API forwarding failed, providing alternative method...")
            self.setup_alternative_forwarding()
        
        # Step 2: Create Gmail automation tools
        print("\\n📧 STEP 2: Gmail Automation Setup")
        self.create_gmail_automation_script()
        
        # Step 3: Create verification tracker
        print("\\n📋 STEP 3: Verification Tracking")
        self.create_verification_tracker()
        
        print("\\n" + "=" * 60)
        print("✅ AUTOMATION SETUP COMPLETE!")
        print("=" * 60)
        
        print("\\n🎯 Next Steps:")
        print("1. Run: python gmail_automation_script.py")
        print("2. Follow the guided Gmail setup process")
        print("3. Test email forwarding for each domain")
        print("4. Verify all Send As addresses")
        
        print(f"\\n📊 Domain Summary:")
        print(f"   • Total Domains: {len(self.config['domains'])}")
        print(f"   • Send As Addresses: {len(self.config['send_as'])}")
        print(f"   • Gmail Account: {self.gmail_account}")
        
        return True

def main():
    """Main automation execution"""
    automator = DomainEmailAutomator("expanded_gmail_config.json")
    automator.run_complete_automation()

if __name__ == "__main__":
    main()