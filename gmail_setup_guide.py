#!/usr/bin/env python3
"""
Gmail Setup Instructions Generator
Creates step-by-step instructions for setting up Send As addresses and filters
"""
import json

def generate_gmail_setup_instructions():
    """Generate comprehensive Gmail setup instructions"""
    
    with open("expanded_gmail_config.json", "r") as f:
        config = json.load(f)
    
    print("🚀 GMAIL MULTI-DOMAIN EMAIL SETUP GUIDE")
    print("=" * 60)
    print(f"📧 Gmail Account: {config['gmail_account']}")
    print(f"🌐 Domains to Configure: {len(config['domains'])}")
    print("=" * 60)
    
    print("\n🔧 STEP 1: ADD SEND AS ADDRESSES")
    print("-" * 40)
    print("1. Open Gmail → Settings (gear icon) → See all settings")
    print("2. Go to 'Accounts and Import' tab")
    print("3. In 'Send mail as' section, click 'Add another email address'")
    print("4. Add each of these addresses:\n")
    
    for i, send_as in enumerate(config['send_as'], 1):
        print(f"   {i:2d}. Email: {send_as['sendAsEmail']}")
        print(f"       Name: {send_as['displayName']}")
        print(f"       ✓ Check 'Treat as an alias'")
        print()
    
    print("🔧 SMTP Configuration for ALL addresses:")
    print("   • SMTP Server: smtp.gmail.com")
    print("   • Port: 587")
    print("   • Username: aegntic@gmail.com")
    print("   • Password: AEp@ssWrd11:11")
    print("   • Security: TLS/STARTTLS")
    
    print("\n🏷️ STEP 2: CREATE EMAIL FILTERS")
    print("-" * 40)
    print("1. In Gmail Settings, go to 'Filters and Blocked Addresses' tab")
    print("2. Click 'Create a new filter'")
    print("3. Create these filters:\n")
    
    for i, domain_config in enumerate(config['domains'], 1):
        if domain_config['domain'] == 'aegntic.com':  # Skip non-existent domain
            continue
            
        domain = domain_config['domain']
        email = domain_config['email']
        print(f"   Filter {i:2d}: to:{email}")
        print(f"           → Apply label: Domain-{domain}")
        print(f"           → Also apply label: 📧-{domain}")
        print()
    
    print("\n📋 STEP 3: VERIFICATION PROCESS")
    print("-" * 40)
    print("After adding each Send As address:")
    print("1. Gmail will send verification emails")
    print("2. Check aegntic@gmail.com inbox for verification emails")
    print("3. Click verification links for each address")
    print("4. Test sending emails from each address")
    
    print("\n🎯 STEP 4: DNS FORWARDING (WHEN RATE LIMITS CLEAR)")
    print("-" * 40)
    print("The following DNS records need to be added for email forwarding:")
    print("(Will be automated once rate limits clear)\n")
    
    for domain_config in config['domains']:
        if domain_config['domain'] == 'aegntic.com':  # Skip non-existent domain
            continue
            
        domain = domain_config['domain']
        email = domain_config['email']
        username = email.split('@')[0]
        
        print(f"📧 {domain}:")
        print(f"   MX Records:")
        print(f"     • mx1.forwardemail.net (Priority 10)")
        print(f"     • mx2.forwardemail.net (Priority 20)")
        print(f"   TXT Record:")
        print(f"     • forward-email={username}:aegntic@gmail.com")
        print()
    
    print("🎁 STEP 5: TESTING")
    print("-" * 40)
    print("After DNS propagation (5-10 minutes):")
    print("1. Send test emails TO each custom address")
    print("2. Verify they arrive in aegntic@gmail.com")
    print("3. Test sending FROM each custom address")
    print("4. Verify recipients see the correct sender address")
    
    print("\n✅ SETUP COMPLETE!")
    print("=" * 60)
    print("📊 Summary:")
    print(f"   • {len([d for d in config['domains'] if d['domain'] != 'aegntic.com'])} domains configured")
    print(f"   • {len(config['send_as'])} Send As addresses")
    print(f"   • All emails forward to: {config['gmail_account']}")
    
    # Generate a simple checklist
    with open("gmail_setup_checklist.txt", "w") as f:
        f.write("GMAIL MULTI-DOMAIN SETUP CHECKLIST\n")
        f.write("=" * 40 + "\n\n")
        
        f.write("☐ Step 1: Add Send As Addresses\n")
        for send_as in config['send_as']:
            f.write(f"  ☐ {send_as['sendAsEmail']} ({send_as['displayName']})\n")
        
        f.write("\n☐ Step 2: Create Filters\n")
        for domain_config in config['domains']:
            if domain_config['domain'] != 'aegntic.com':
                f.write(f"  ☐ Filter for {domain_config['email']} → Domain-{domain_config['domain']}\n")
        
        f.write("\n☐ Step 3: Verify Addresses\n")
        for send_as in config['send_as']:
            f.write(f"  ☐ Verify {send_as['sendAsEmail']}\n")
        
        f.write("\n☐ Step 4: Test Email Forwarding\n")
        for domain_config in config['domains']:
            if domain_config['domain'] != 'aegntic.com':
                f.write(f"  ☐ Test {domain_config['email']} → aegntic@gmail.com\n")
    
    print("\n📋 Checklist saved to: gmail_setup_checklist.txt")

if __name__ == "__main__":
    generate_gmail_setup_instructions()