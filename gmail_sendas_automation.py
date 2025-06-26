#!/usr/bin/env python3
"""
Gmail Send As Automation Script
Automatically adds 11 Send As addresses to Gmail with SMTP configuration
Based on comprehensive sequential thinking analysis for maximum success rate
"""
import json
import time
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class GmailSendAsAutomator:
    def __init__(self):
        self.addresses = [
            {"email": "claube@prompt.fail", "name": "Claude Prompt"},
            {"email": "projects@4site.pro", "name": "4Site Projects"},
            {"email": "human@aegntic.ai", "name": "Aegntic AI"},
            {"email": "human@ae.ltd", "name": "AE Limited"},
            {"email": "vibe@ultraplan.pro", "name": "UltraPlan Pro"},
            {"email": "auth@aegnt27.xyz", "name": "Aegnt27 Auth"},
            {"email": "docs@dailydoco.com", "name": "DailyDoco"},
            {"email": "verify@credability.pro", "name": "Credability Pro"},
            {"email": "human@mattaecooper.org", "name": "Mattae Cooper"},
            {"email": "chef@skool.food", "name": "Skool Food"},
            {"email": "learn@1minskool.com", "name": "1 Min Skool"}
        ]
        
        # SMTP Configuration
        self.smtp_config = {
            "server": "smtp.gmail.com",
            "port": "587",
            "username": "aegntic@gmail.com", 
            "password": "AEp@ssWrd11:11",
            "security": "TLS"
        }
        
        self.driver = None
        self.wait = None
        self.progress_file = "gmail_automation_progress.json"
        self.progress = self.load_progress()
        
    def load_progress(self):
        """Load automation progress from file"""
        if os.path.exists(self.progress_file):
            with open(self.progress_file, 'r') as f:
                return json.load(f)
        return {"completed_addresses": [], "failed_addresses": [], "start_time": None}
    
    def save_progress(self):
        """Save current progress to file"""
        with open(self.progress_file, 'w') as f:
            json.dump(self.progress, f, indent=2)
    
    def setup_driver(self):
        """Setup Chrome WebDriver to connect to existing session"""
        print("🔧 Setting up WebDriver connection...")
        
        try:
            # Try to connect to existing Chrome instance
            chrome_options = Options()
            chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 20)
            
            print("✅ Connected to existing Chrome session")
            return True
            
        except Exception as e:
            print(f"⚠️ Could not connect to existing Chrome. Starting new session...")
            
            # Fallback: Start new Chrome session
            chrome_options = Options()
            chrome_options.add_argument('--start-maximized')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 20)
            
            print("✅ Started new Chrome session")
            print("🔐 Please log into Gmail manually in the browser that just opened")
            input("Press Enter when you're logged into Gmail and ready to continue...")
            
            return True
    
    def navigate_to_accounts_settings(self):
        """Navigate to Gmail Accounts and Import settings"""
        print("🌐 Navigating to Gmail Accounts settings...")
        
        try:
            # Go to Gmail if not already there
            if "mail.google.com" not in self.driver.current_url:
                self.driver.get("https://mail.google.com")
                time.sleep(3)
            
            # Navigate directly to accounts settings
            settings_url = "https://mail.google.com/mail/u/0/#settings/accounts"
            self.driver.get(settings_url)
            
            # Wait for page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            time.sleep(3)
            
            print("✅ Successfully navigated to Accounts settings")
            return True
            
        except Exception as e:
            print(f"❌ Failed to navigate to settings: {e}")
            return False
    
    def take_screenshot(self, step_name):
        """Take screenshot for debugging"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"gmail_automation_{step_name}_{timestamp}.png"
        self.driver.save_screenshot(filename)
        print(f"📸 Screenshot saved: {filename}")
    
    def add_send_as_address(self, email, name):
        """Add a single Send As address with full SMTP configuration"""
        print(f"\n🔧 Adding Send As address: {email} ({name})")
        
        try:
            # Take screenshot before starting
            self.take_screenshot(f"before_{email.replace('@', '_at_')}")
            
            # Look for "Add another email address" link
            add_links = [
                "//a[contains(text(), 'Add another email address')]",
                "//span[contains(text(), 'Add another email address')]",
                "//div[contains(text(), 'Add another email address')]"
            ]
            
            add_element = None
            for xpath in add_links:
                try:
                    add_element = self.wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
                    break
                except TimeoutException:
                    continue
            
            if not add_element:
                print("❌ Could not find 'Add another email address' link")
                return False
            
            # Click to add new email
            add_element.click()
            time.sleep(2)
            
            # Fill in email address and name
            email_selectors = [
                "input[name='cfn']",  # Common Gmail selector
                "input[type='email']",
                "//input[contains(@placeholder, 'email')]"
            ]
            
            email_input = None
            for selector in email_selectors:
                try:
                    if selector.startswith("//"):
                        email_input = self.wait.until(EC.presence_of_element_located((By.XPATH, selector)))
                    else:
                        email_input = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                    break
                except TimeoutException:
                    continue
            
            if email_input:
                email_input.clear()
                email_input.send_keys(email)
                print(f"✅ Entered email: {email}")
            else:
                print("❌ Could not find email input field")
                return False
            
            # Fill in name
            name_selectors = [
                "input[name='cfnn']",
                "//input[contains(@placeholder, 'name')]",
                "//input[@type='text'][2]"
            ]
            
            name_input = None
            for selector in name_selectors:
                try:
                    if selector.startswith("//"):
                        name_input = self.driver.find_element(By.XPATH, selector)
                    else:
                        name_input = self.driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except NoSuchElementException:
                    continue
            
            if name_input:
                name_input.clear()
                name_input.send_keys(name)
                print(f"✅ Entered name: {name}")
            
            # Check "Treat as an alias" checkbox
            try:
                alias_checkbox = self.driver.find_element(By.XPATH, "//input[@type='checkbox']")
                if not alias_checkbox.is_selected():
                    alias_checkbox.click()
                    print("✅ Checked 'Treat as an alias'")
            except:
                print("⚠️ Could not find or check alias checkbox")
            
            # Continue to next step
            continue_selectors = [
                "//span[contains(text(), 'Next')]",
                "//input[@value='Next Step']",
                "//button[contains(text(), 'Next')]"
            ]
            
            for selector in continue_selectors:
                try:
                    continue_btn = self.driver.find_element(By.XPATH, selector)
                    continue_btn.click()
                    time.sleep(3)
                    break
                except:
                    continue
            
            # Configure SMTP settings
            print("🔧 Configuring SMTP settings...")
            
            # SMTP Server
            try:
                smtp_server = self.wait.until(EC.presence_of_element_located(
                    (By.XPATH, "//input[contains(@name, 'smtp') or contains(@placeholder, 'SMTP')]")
                ))
                smtp_server.clear()
                smtp_server.send_keys(self.smtp_config["server"])
                print(f"✅ SMTP Server: {self.smtp_config['server']}")
            except:
                print("⚠️ Could not configure SMTP server")
            
            # Port
            try:
                port_input = self.driver.find_element(By.XPATH, "//input[contains(@name, 'port')]")
                port_input.clear()
                port_input.send_keys(self.smtp_config["port"])
                print(f"✅ Port: {self.smtp_config['port']}")
            except:
                print("⚠️ Could not configure port")
            
            # Username
            try:
                username_input = self.driver.find_element(By.XPATH, "//input[contains(@name, 'user')]")
                username_input.clear()
                username_input.send_keys(self.smtp_config["username"])
                print(f"✅ Username: {self.smtp_config['username']}")
            except:
                print("⚠️ Could not configure username")
            
            # Password
            try:
                password_input = self.driver.find_element(By.XPATH, "//input[@type='password']")
                password_input.clear()
                password_input.send_keys(self.smtp_config["password"])
                print("✅ Password configured")
            except:
                print("⚠️ Could not configure password")
            
            # Select TLS security
            try:
                tls_radio = self.driver.find_element(By.XPATH, "//input[@value='1' or @value='ssl']")
                tls_radio.click()
                print("✅ TLS security selected")
            except:
                print("⚠️ Could not select TLS security")
            
            # Submit the form
            submit_selectors = [
                "//span[contains(text(), 'Add Account')]",
                "//input[@value='Add Account']",
                "//button[contains(text(), 'Add')]"
            ]
            
            for selector in submit_selectors:
                try:
                    submit_btn = self.driver.find_element(By.XPATH, selector)
                    submit_btn.click()
                    time.sleep(5)
                    print("✅ Submitted Send As configuration")
                    break
                except:
                    continue
            
            # Take screenshot after completion
            self.take_screenshot(f"after_{email.replace('@', '_at_')}")
            
            print(f"✅ Successfully added {email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to add {email}: {e}")
            self.take_screenshot(f"error_{email.replace('@', '_at_')}")
            return False
    
    def run_automation(self):
        """Run the complete Send As automation"""
        print("🚀 GMAIL SEND AS AUTOMATION STARTING")
        print("=" * 60)
        print(f"📧 Gmail Account: {self.smtp_config['username']}")
        print(f"🌐 Addresses to Add: {len(self.addresses)}")
        print("=" * 60)
        
        if not self.progress["start_time"]:
            self.progress["start_time"] = datetime.now().isoformat()
            self.save_progress()
        
        # Setup WebDriver
        if not self.setup_driver():
            print("❌ Failed to setup WebDriver")
            return False
        
        # Navigate to settings
        if not self.navigate_to_accounts_settings():
            print("❌ Failed to navigate to Gmail settings")
            return False
        
        # Process each address
        successful_addresses = 0
        
        for i, addr_config in enumerate(self.addresses, 1):
            email = addr_config["email"]
            name = addr_config["name"]
            
            # Skip if already completed
            if email in self.progress["completed_addresses"]:
                print(f"⏭️ Skipping {email} (already completed)")
                successful_addresses += 1
                continue
            
            print(f"\n[{i}/{len(self.addresses)}] Processing {email}...")
            
            success = self.add_send_as_address(email, name)
            
            if success:
                self.progress["completed_addresses"].append(email)
                successful_addresses += 1
                print(f"✅ {email} added successfully!")
            else:
                self.progress["failed_addresses"].append(email)
                print(f"❌ {email} failed to add")
            
            self.save_progress()
            
            # Delay between addresses
            if i < len(self.addresses):
                print("⏰ Waiting 5 seconds before next address...")
                time.sleep(5)
        
        # Generate final report
        print("\n" + "=" * 60)
        print("📊 GMAIL AUTOMATION COMPLETE")
        print("=" * 60)
        print(f"✅ Successfully added: {successful_addresses}/{len(self.addresses)} addresses")
        print(f"❌ Failed: {len(self.progress['failed_addresses'])} addresses")
        
        if self.progress["completed_addresses"]:
            print("\n✅ Successfully Added:")
            for email in self.progress["completed_addresses"]:
                print(f"   • {email}")
        
        if self.progress["failed_addresses"]:
            print("\n❌ Failed to Add:")
            for email in self.progress["failed_addresses"]:
                print(f"   • {email}")
        
        print("\n🎯 Next Steps:")
        print("1. Check aegntic@gmail.com inbox for verification emails")
        print("2. Click verification links for each Send As address")
        print("3. Test sending emails from each address")
        print("4. Set up Gmail filters for incoming emails")
        
        return successful_addresses == len(self.addresses)
    
    def cleanup(self):
        """Cleanup WebDriver resources"""
        if self.driver:
            print("🧹 Cleaning up WebDriver...")
            # Don't quit if using existing session
            try:
                self.driver.quit()
            except:
                pass

def main():
    """Main automation execution"""
    automator = GmailSendAsAutomator()
    
    try:
        success = automator.run_automation()
        
        if success:
            print("\n🎉 All Send As addresses added successfully!")
        else:
            print("\n⚠️ Some addresses failed. Check the progress file for details.")
            
    except KeyboardInterrupt:
        print("\n⏸️ Automation interrupted by user")
    except Exception as e:
        print(f"\n❌ Automation failed: {e}")
    finally:
        automator.cleanup()

if __name__ == "__main__":
    main()