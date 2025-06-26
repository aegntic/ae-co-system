#!/usr/bin/env python3
"""
Manual Gmail Setup Steps Generator
Since automation is having connection issues, this generates precise manual steps
"""

def generate_manual_steps():
    addresses = [
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
    
    print("🚀 MANUAL GMAIL SEND AS SETUP")
    print("=" * 60)
    print("📧 In your existing Gmail session, follow these exact steps:")
    print("=" * 60)
    
    print("\n🔧 INITIAL SETUP:")
    print("1. Click the ⚙️ gear icon (top right)")
    print("2. Click 'See all settings'") 
    print("3. Click 'Accounts and Import' tab")
    print("4. Scroll to 'Send mail as' section")
    
    print("\n📧 FOR EACH ADDRESS (11 total):")
    print("=" * 30)
    
    for i, addr in enumerate(addresses, 1):
        print(f"\n--- ADDRESS {i}/11 ---")
        print(f"Email: {addr['email']}")
        print(f"Name:  {addr['name']}")
        print()
        print("STEPS:")
        print("1. Click 'Add another email address'")
        print("2. Email address: " + addr['email'])
        print("3. Name: " + addr['name'])
        print("4. ✅ Check 'Treat as an alias'")
        print("5. Click 'Next Step'")
        print()
        print("SMTP SETTINGS:")
        print("   • SMTP Server: smtp.gmail.com")
        print("   • Port: 587")
        print("   • Username: aegntic@gmail.com")
        print("   • Password: AEp@ssWrd11:11")
        print("   • ◉ Select 'Secured connection using TLS'")
        print("6. Click 'Add Account'")
        print("7. ✅ Verification email will be sent")
        print("-" * 40)
    
    print("\n🎯 AFTER ALL 11 ADDRESSES:")
    print("1. Check aegntic@gmail.com inbox")
    print("2. Click verification links in emails")
    print("3. Return here when done!")
    
    print("\n⏱️ ESTIMATED TIME: 10-15 minutes")
    print("🔥 TIP: Open this in a second terminal to reference while working")

if __name__ == "__main__":
    generate_manual_steps()