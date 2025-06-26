#!/usr/bin/env python3
"""
Gmail Send As Automation - Simple Connection
Simplified approach to connect to existing Chrome session
"""
import json
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

class GmailSimpleAutomator:
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
        
        self.driver = None
        self.wait = None
    
    def connect_to_chrome(self):
        """Connect to Chrome with remote debugging"""
        print("🔧 Connecting to Chrome with debugging port...")
        
        try:
            # Simple Chrome options for debugging connection
            chrome_options = Options()
            chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 10)
            
            print("✅ Connected to Chrome!")
            print(f"🌐 Current page: {self.driver.current_url}")
            return True
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def navigate_to_settings(self):
        """Go to Gmail settings"""
        print("🌐 Navigating to Gmail Accounts settings...")
        
        settings_url = "https://mail.google.com/mail/u/0/#settings/accounts"
        self.driver.get(settings_url)
        time.sleep(5)
        print("✅ Navigated to Gmail settings")
        return True
    
    def add_single_address(self, email, name):
        """Add one Send As address"""
        print(f"\n📧 Adding: {email} ({name})")
        
        try:
            # Click "Add another email address"
            add_link = self.wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(text(), 'Add another email address')]")
            ))
            add_link.click()
            time.sleep(2)
            
            # Fill email
            email_field = self.wait.until(EC.presence_of_element_located(
                (By.XPATH, "//input[@type='email']")
            ))
            email_field.clear()
            email_field.send_keys(email)
            
            # Fill name  
            name_field = self.driver.find_element(By.XPATH, "//input[@type='text'][last()]")
            name_field.clear()
            name_field.send_keys(name)
            
            # Check alias checkbox
            try:
                checkbox = self.driver.find_element(By.XPATH, "//input[@type='checkbox']")
                if not checkbox.is_selected():
                    checkbox.click()
            except:
                pass
            
            # Click Next
            next_btn = self.driver.find_element(By.XPATH, "//input[@value='Next Step']")
            next_btn.click()
            time.sleep(3)
            
            # SMTP settings
            smtp_field = self.wait.until(EC.presence_of_element_located(
                (By.XPATH, "//input[@type='text'][1]")
            ))
            smtp_field.clear()
            smtp_field.send_keys("smtp.gmail.com")
            
            port_field = self.driver.find_element(By.XPATH, "//input[@type='text'][2]")
            port_field.clear()
            port_field.send_keys("587")
            
            user_field = self.driver.find_element(By.XPATH, "//input[@type='text'][3]")
            user_field.clear()
            user_field.send_keys("aegntic@gmail.com")
            
            pass_field = self.driver.find_element(By.XPATH, "//input[@type='password']")
            pass_field.clear()
            pass_field.send_keys("AEp@ssWrd11:11")
            
            # Select TLS
            tls_radio = self.driver.find_element(By.XPATH, "//input[@value='1']")
            tls_radio.click()
            
            # Submit
            submit_btn = self.driver.find_element(By.XPATH, "//input[@value='Add Account']")
            submit_btn.click()
            time.sleep(4)
            
            print(f"✅ Added {email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to add {email}: {e}")
            return False
    
    def run_automation(self):
        """Run the full automation"""
        print("🚀 GMAIL SEND AS AUTOMATION")
        print("=" * 50)
        
        if not self.connect_to_chrome():
            return False
            
        if not self.navigate_to_settings():
            return False
        
        successful = 0
        
        for i, addr in enumerate(self.addresses, 1):
            print(f"\n[{i}/{len(self.addresses)}] Processing...")
            
            success = self.add_single_address(addr["email"], addr["name"])
            
            if success:
                successful += 1
            
            # Go back to settings for next one
            if i < len(self.addresses):
                self.driver.get("https://mail.google.com/mail/u/0/#settings/accounts")
                time.sleep(3)
        
        print(f"\n✅ Complete! Added {successful}/{len(self.addresses)} addresses")
        return True

def main():
    automator = GmailSimpleAutomator()
    automator.run_automation()

if __name__ == "__main__":
    main()