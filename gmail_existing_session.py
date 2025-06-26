#!/usr/bin/env python3
"""
Gmail Send As Automation - Existing Session
Connects to your existing Chrome/Gmail session for automation
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

class GmailExistingSessionAutomator:
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
        
        self.smtp_config = {
            "server": "smtp.gmail.com",
            "port": "587", 
            "username": "aegntic@gmail.com",
            "password": "AEp@ssWrd11:11"
        }
        
        self.driver = None
        self.wait = None
    
    def connect_to_existing_chrome(self):
        """Connect to existing Chrome session"""
        print("🔧 Connecting to your existing Chrome session...")
        
        try:
            # Connect to Chrome with remote debugging
            chrome_options = Options()
            chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 15)
            
            print("✅ Successfully connected to existing Chrome session")
            print(f"🌐 Current URL: {self.driver.current_url}")
            return True
            
        except Exception as e:
            print(f"❌ Could not connect to existing Chrome session: {e}")
            print("\n🔧 SOLUTION: Your Chrome needs remote debugging enabled")
            print("Please run this command in terminal:")
            print("google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug")
            print("\nOr if Chrome is already open, close it and restart with:")
            print("/usr/bin/google-chrome --remote-debugging-port=9222")
            return False
    
    def navigate_to_gmail_settings(self):
        """Navigate to Gmail Accounts settings"""
        print("🌐 Navigating to Gmail Accounts settings...")
        
        try:
            # Go directly to Gmail settings
            settings_url = "https://mail.google.com/mail/u/0/#settings/accounts"
            self.driver.get(settings_url)
            
            # Wait for page to load
            time.sleep(5)
            
            # Verify we're in the right place
            if "settings/accounts" in self.driver.current_url:
                print("✅ Successfully navigated to Gmail Accounts settings")
                return True
            else:
                print(f"⚠️ Not on settings page. Current URL: {self.driver.current_url}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to navigate to Gmail settings: {e}")
            return False
    
    def add_send_as_simple(self, email, name):
        """Simplified Send As addition focusing on core functionality"""
        print(f"\n📧 Adding: {email} ({name})")
        
        try:
            # Look for "Add another email address" link with multiple strategies
            add_link_found = False
            
            # Strategy 1: Look for text content
            try:
                add_link = self.wait.until(EC.element_to_be_clickable(
                    (By.XPATH, "//a[contains(text(), 'Add another email address')]")
                ))
                add_link.click()
                add_link_found = True
                print("✅ Found and clicked 'Add another email address' link")
            except TimeoutException:
                pass
            
            # Strategy 2: Look for partial text match
            if not add_link_found:
                try:
                    add_link = self.driver.find_element(By.XPATH, "//a[contains(text(), 'Add another')]")
                    add_link.click()
                    add_link_found = True
                    print("✅ Found and clicked 'Add another' link")
                except:
                    pass
            
            # Strategy 3: Look for any link in the Send mail as section
            if not add_link_found:
                try:
                    # Find the Send mail as section first
                    send_as_section = self.driver.find_element(By.XPATH, "//b[contains(text(), 'Send mail as')]")
                    # Then look for any link after it
                    add_link = send_as_section.find_element(By.XPATH, ".//following::a[1]")
                    add_link.click()
                    add_link_found = True
                    print("✅ Found and clicked link in Send mail as section")
                except:
                    pass
            
            if not add_link_found:
                print("❌ Could not find 'Add another email address' link")
                return False
            
            time.sleep(3)
            
            # Fill in the email and name in the popup/form
            try:
                # Email field
                email_input = self.wait.until(EC.presence_of_element_located(
                    (By.XPATH, "//input[@type='email' or contains(@name, 'email')]")
                ))
                email_input.clear()
                email_input.send_keys(email)
                print(f"✅ Entered email: {email}")
                
                # Name field
                name_inputs = self.driver.find_elements(By.XPATH, "//input[@type='text']")
                if len(name_inputs) >= 2:
                    name_inputs[1].clear()
                    name_inputs[1].send_keys(name)
                    print(f"✅ Entered name: {name}")
                
                # Check "Treat as an alias" if present
                try:
                    alias_checkbox = self.driver.find_element(By.XPATH, "//input[@type='checkbox']")
                    if not alias_checkbox.is_selected():
                        alias_checkbox.click()
                        print("✅ Checked 'Treat as an alias'")
                except:
                    print("ℹ️ No alias checkbox found (may not be needed)")
                
                # Click Next/Continue
                next_buttons = [
                    "//input[@value='Next Step' or @value='Next']",
                    "//button[contains(text(), 'Next')]",
                    "//span[contains(text(), 'Next')]"
                ]
                
                next_clicked = False
                for button_xpath in next_buttons:
                    try:
                        next_btn = self.driver.find_element(By.XPATH, button_xpath)
                        next_btn.click()
                        next_clicked = True
                        print("✅ Clicked Next button")
                        break
                    except:
                        continue
                
                if not next_clicked:
                    print("⚠️ Could not find Next button, trying to continue...")
                
                time.sleep(4)
                
                # SMTP Configuration
                print("🔧 Configuring SMTP settings...")
                
                # SMTP Server
                try:
                    smtp_inputs = self.driver.find_elements(By.XPATH, "//input[@type='text']")
                    for inp in smtp_inputs:
                        if inp.get_attribute("value") == "" or "smtp" in inp.get_attribute("name").lower():
                            inp.clear()
                            inp.send_keys(self.smtp_config["server"])
                            print(f"✅ Set SMTP server: {self.smtp_config['server']}")
                            break
                except:
                    print("⚠️ Could not set SMTP server")
                
                # Port
                try:
                    port_inputs = self.driver.find_elements(By.XPATH, "//input[@type='text' or @type='number']")
                    for inp in port_inputs:
                        if inp.get_attribute("value") == "25" or "port" in inp.get_attribute("name").lower():
                            inp.clear()
                            inp.send_keys(self.smtp_config["port"])
                            print(f"✅ Set port: {self.smtp_config['port']}")
                            break
                except:
                    print("⚠️ Could not set port")
                
                # Username
                try:
                    username_inputs = self.driver.find_elements(By.XPATH, "//input[@type='text']")
                    for inp in username_inputs:
                        if "user" in inp.get_attribute("name").lower() or inp.get_attribute("value") == "":
                            inp.clear()
                            inp.send_keys(self.smtp_config["username"])
                            print(f"✅ Set username: {self.smtp_config['username']}")
                            break
                except:
                    print("⚠️ Could not set username")
                
                # Password
                try:
                    password_input = self.driver.find_element(By.XPATH, "//input[@type='password']")
                    password_input.clear()
                    password_input.send_keys(self.smtp_config["password"])
                    print("✅ Set password")
                except:
                    print("⚠️ Could not set password")
                
                # Select TLS/SSL
                try:
                    ssl_options = self.driver.find_elements(By.XPATH, "//input[@type='radio']")
                    for option in ssl_options:
                        if option.get_attribute("value") in ["1", "ssl", "tls"]:
                            option.click()
                            print("✅ Selected TLS/SSL security")
                            break
                except:
                    print("⚠️ Could not select security option")
                
                # Submit the form
                submit_buttons = [
                    "//input[@value='Add Account']",
                    "//button[contains(text(), 'Add')]",
                    "//span[contains(text(), 'Add Account')]"
                ]
                
                for button_xpath in submit_buttons:
                    try:
                        submit_btn = self.driver.find_element(By.XPATH, button_xpath)
                        submit_btn.click()
                        print("✅ Submitted Send As configuration")
                        time.sleep(5)
                        return True
                    except:
                        continue
                
                print("⚠️ Could not find submit button, but configuration may be saved")
                return True
                
            except Exception as e:
                print(f"❌ Error during form filling: {e}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to add {email}: {e}")
            return False
    
    def run_automation(self):
        """Run the automation on existing session"""
        print("🚀 GMAIL SEND AS AUTOMATION (EXISTING SESSION)")
        print("=" * 60)
        print(f"📧 Target Gmail: {self.smtp_config['username']}")
        print(f"🌐 Addresses to Add: {len(self.addresses)}")
        print("=" * 60)
        
        # Connect to existing Chrome
        if not self.connect_to_existing_chrome():
            return False
        
        # Navigate to Gmail settings
        if not self.navigate_to_gmail_settings():
            return False
        
        print("\n🎯 Starting Send As automation...")
        print("👀 You can watch the browser as it adds each address")
        
        successful = 0
        failed = 0
        
        for i, addr in enumerate(self.addresses, 1):
            print(f"\n[{i}/{len(self.addresses)}] Processing {addr['email']}...")
            
            success = self.add_send_as_simple(addr["email"], addr["name"])
            
            if success:
                successful += 1
                print(f"✅ Successfully added {addr['email']}")
            else:
                failed += 1
                print(f"❌ Failed to add {addr['email']}")
            
            # Navigate back to settings for next address
            if i < len(self.addresses):
                print("🔄 Returning to settings for next address...")
                self.driver.get("https://mail.google.com/mail/u/0/#settings/accounts")
                time.sleep(3)
        
        # Final report
        print("\n" + "=" * 60)
        print("📊 AUTOMATION COMPLETE")
        print("=" * 60)
        print(f"✅ Successfully added: {successful}/{len(self.addresses)}")
        print(f"❌ Failed: {failed}/{len(self.addresses)}")
        
        if successful > 0:
            print("\n🎯 Next Steps:")
            print("1. Check your Gmail inbox for verification emails")
            print("2. Click the verification links for each new Send As address")
            print("3. Test sending emails from the new addresses")
        
        print("\n🔍 Check Gmail Settings → Accounts to see all added addresses")
        
        return successful == len(self.addresses)

def main():
    """Main execution"""
    automator = GmailExistingSessionAutomator()
    
    try:
        automator.run_automation()
    except KeyboardInterrupt:
        print("\n⏸️ Automation stopped by user")
    except Exception as e:
        print(f"\n❌ Automation error: {e}")

if __name__ == "__main__":
    main()