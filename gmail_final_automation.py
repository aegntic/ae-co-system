#!/usr/bin/env python3
"""
Final Gmail Automation Script - Ultra Quality
Automates complete Gmail setup for domain-based email management
"""
import time
import json
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains

def setup_driver():
    """Setup Chrome driver with optimal configuration"""
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_experimental_option('detach', True)
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def human_pause(duration=2):
    """Human-like pause between actions"""
    time.sleep(duration + (time.time() % 1))  # Add natural variation

def gmail_login(driver, email, password):
    """Login to Gmail with human-like interactions"""
    print(f"🔐 Logging into Gmail as {email}")
    
    driver.get("https://accounts.google.com/signin")
    wait = WebDriverWait(driver, 20)
    
    try:
        # Enter email
        email_field = wait.until(EC.element_to_be_clickable((By.ID, "identifierId")))
        human_pause(1)
        
        # Human-like typing
        for char in email:
            email_field.send_keys(char)
            time.sleep(0.1 + (time.time() % 0.05))  # Variable typing speed
        
        human_pause(0.5)
        next_btn = driver.find_element(By.ID, "identifierNext")
        next_btn.click()
        
        # Enter password
        password_field = wait.until(EC.element_to_be_clickable((By.NAME, "password")))
        human_pause(1.5)
        
        # Human-like password typing
        for char in password:
            password_field.send_keys(char)
            time.sleep(0.08 + (time.time() % 0.03))
        
        human_pause(0.5)
        password_next = driver.find_element(By.ID, "passwordNext")
        password_next.click()
        
        # Wait for successful login
        wait.until(EC.url_contains("myaccount"))
        print("✅ Successfully logged into Gmail")
        return True
        
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return False

def navigate_to_gmail_settings(driver):
    """Navigate to Gmail settings with human-like behavior"""
    print("🔄 Navigating to Gmail settings...")
    
    # Go directly to Gmail
    driver.get("https://mail.google.com")
    wait = WebDriverWait(driver, 20)
    human_pause(3)
    
    try:
        # Wait for Gmail to load completely
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[role="main"]')))
        human_pause(2)
        
        # Click settings gear icon
        settings_gear = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-tooltip="Settings"]')))
        settings_gear.click()
        human_pause(1)
        
        # Click "See all settings"
        see_all_settings = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[text()='See all settings']")))
        see_all_settings.click()
        human_pause(2)
        
        print("✅ Successfully opened Gmail settings")
        return True
        
    except Exception as e:
        print(f"❌ Failed to navigate to settings: {e}")
        return False

def setup_send_as_addresses(driver, send_as_configs):
    """Setup Send As addresses for each domain"""
    print(f"📧 Setting up {len(send_as_configs)} Send As addresses...")
    
    wait = WebDriverWait(driver, 20)
    
    try:
        # Click on "Accounts and Import" tab
        accounts_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Accounts and Import']")))
        accounts_tab.click()
        human_pause(2)
        
        for i, config in enumerate(send_as_configs, 1):
            print(f"📮 Adding {i}/{len(send_as_configs)}: {config['sendAsEmail']}")
            
            # Find and click "Add another email address"
            add_email_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Add another email address')]")))
            add_email_link.click()
            human_pause(2)
            
            # Handle popup window
            if len(driver.window_handles) > 1:
                driver.switch_to.window(driver.window_handles[-1])
                
                # Fill name field
                name_field = wait.until(EC.presence_of_element_located((By.NAME, "name")))
                name_field.clear()
                human_pause(0.5)
                
                # Type display name with human-like behavior
                for char in config['displayName']:
                    name_field.send_keys(char)
                    time.sleep(0.08)
                
                # Fill email field
                email_field = driver.find_element(By.NAME, "email")
                email_field.clear()
                human_pause(0.5)
                
                # Type email with human-like behavior
                for char in config['sendAsEmail']:
                    email_field.send_keys(char)
                    time.sleep(0.08)
                
                human_pause(1)
                
                # Click Next Step
                next_step_btn = driver.find_element(By.XPATH, "//input[@value='Next Step »']")
                next_step_btn.click()
                human_pause(3)
                
                # Handle SMTP configuration if needed
                try:
                    # Check if we're on SMTP configuration page
                    if driver.find_elements(By.NAME, "username"):
                        print(f"⚙️  Configuring SMTP for {config['sendAsEmail']}")
                        
                        username_field = driver.find_element(By.NAME, "username")
                        username_field.clear()
                        username_field.send_keys(config['smtpMsa']['username'])
                        
                        password_field = driver.find_element(By.NAME, "password")
                        password_field.clear()
                        password_field.send_keys(config['smtpMsa']['password'])
                        
                        human_pause(1)
                        
                        # Click Add Account
                        add_account_btn = driver.find_element(By.XPATH, "//input[@value='Add Account »']")
                        add_account_btn.click()
                        human_pause(2)
                        
                except Exception as smtp_error:
                    print(f"⚠️  SMTP config skipped for {config['sendAsEmail']}: {smtp_error}")
                    # Try to find and click any submit button
                    submit_buttons = driver.find_elements(By.CSS_SELECTOR, 'input[type="submit"]')
                    if submit_buttons:
                        submit_buttons[0].click()
                        human_pause(2)
                
                # Switch back to main window
                driver.switch_to.window(driver.window_handles[0])
                human_pause(2)
                
                print(f"✅ Added Send As address: {config['sendAsEmail']}")
            
            human_pause(2)  # Pause before next iteration
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to setup Send As addresses: {e}")
        return False

def create_domain_filters(driver, domains):
    """Create filters for domain-based inbox organization"""
    print(f"🏷️  Creating {len(domains)} domain filters...")
    
    wait = WebDriverWait(driver, 20)
    
    try:
        # Navigate to Filters and Blocked Addresses
        filters_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Filters and Blocked Addresses']")))
        filters_tab.click()
        human_pause(2)
        
        for i, domain_config in enumerate(domains, 1):
            domain = domain_config['domain']
            email = domain_config['email']
            
            print(f"🔍 Creating filter {i}/{len(domains)} for {domain}")
            
            # Click "Create a new filter"
            create_filter_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Create a new filter')]")))
            create_filter_link.click()
            human_pause(2)
            
            # Fill filter criteria
            to_field = wait.until(EC.presence_of_element_located((By.NAME, "to")))
            to_field.clear()
            
            # Type email address with human-like behavior
            for char in email:
                to_field.send_keys(char)
                time.sleep(0.07)
            
            human_pause(1)
            
            # Click "Create filter"
            create_filter_btn = driver.find_element(By.XPATH, "//input[@value='Create filter']")
            create_filter_btn.click()
            human_pause(2)
            
            # Select "Apply the label" checkbox
            label_checkbox = wait.until(EC.element_to_be_clickable((By.NAME, "cf2_al")))
            if not label_checkbox.is_selected():
                label_checkbox.click()
                human_pause(0.5)
            
            # Create new label
            new_label_link = driver.find_element(By.XPATH, "//a[contains(text(), 'New label')]")
            new_label_link.click()
            human_pause(1)
            
            # Enter label name
            label_name_field = wait.until(EC.presence_of_element_located((By.NAME, "newlabel")))
            label_name = f"Domain-{domain}"
            
            for char in label_name:
                label_name_field.send_keys(char)
                time.sleep(0.06)
            
            human_pause(0.5)
            
            # Click Create
            create_label_btn = driver.find_element(By.XPATH, "//input[@value='Create']")
            create_label_btn.click()
            human_pause(1)
            
            # Click "Create filter" to finalize
            final_create_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@value='Create filter']")))
            final_create_btn.click()
            human_pause(2)
            
            print(f"✅ Created filter and label for {domain}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create domain filters: {e}")
        return False

def main():
    """Main automation execution"""
    print("🚀 Starting Ultra-Quality Gmail Domain Automation")
    print("=" * 50)
    
    # Load configuration
    try:
        with open("gmail_automation_config.json", "r") as f:
            config = json.load(f)
    except FileNotFoundError:
        print("❌ Configuration file not found. Please run the config generator first.")
        return
    
    # Setup browser
    print("🌐 Setting up browser...")
    driver = setup_driver()
    
    try:
        # Login to Gmail
        if not gmail_login(driver, config['gmail_account'], "AEp@ssWrd11:11"):
            print("❌ Gmail login failed")
            return
        
        human_pause(3)
        
        # Navigate to Gmail settings
        if not navigate_to_gmail_settings(driver):
            print("❌ Failed to access Gmail settings")
            return
        
        # Setup Send As addresses
        if not setup_send_as_addresses(driver, config['send_as']):
            print("❌ Failed to setup Send As addresses")
            return
        
        # Create domain filters
        if not create_domain_filters(driver, config['domains']):
            print("❌ Failed to create domain filters")
            return
        
        print("\n" + "=" * 50)
        print("✅ GMAIL AUTOMATION COMPLETED SUCCESSFULLY!")
        print("=" * 50)
        print("\n📋 Configuration Summary:")
        print(f"   • Gmail Account: {config['gmail_account']}")
        print(f"   • Send As Addresses: {len(config['send_as'])}")
        print(f"   • Domain Filters: {len(config['domains'])}")
        
        print("\n📧 Send As Addresses Added:")
        for send_as in config['send_as']:
            print(f"   • {send_as['sendAsEmail']} ({send_as['displayName']})")
        
        print("\n🏷️  Domain Labels Created:")
        for domain in config['domains']:
            print(f"   • Domain-{domain['domain']} for {domain['email']}")
        
        print("\n🔧 Next Steps:")
        print("   1. Check Gmail Settings > Accounts for verification emails")
        print("   2. Verify each Send As address by clicking verification links")
        print("   3. Test sending emails from each domain")
        print("   4. Emails to your domains will automatically be labeled")
        
        # Keep browser open for verification
        input("\n🎯 Gmail automation complete! Press Enter to close browser...")
        
    except Exception as e:
        print(f"❌ Critical error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        try:
            driver.quit()
        except:
            pass

if __name__ == "__main__":
    main()