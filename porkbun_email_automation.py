#!/usr/bin/env python3
"""
Porkbun Email Forwarding Automation
Sets up proper DNS records for email forwarding using Forward Email service
"""
import json
import requests
import time

class PorkbunEmailSetup:
    def __init__(self):
        self.api_key = "pk1_c1ef1c487a138e4c3b8904b00fe8b85e6a24667935265a1567062eb88703f1a0"
        self.secret_key = "sk1_ad060b8068f5d1263846303394bf7449a19fe2628430c3b2f9ea73492969b915"
        self.base_url = "https://porkbun.com/api/json/v3"
        self.target_email = "aegntic@gmail.com"
        
        # 11 domains (excluding aegntic.com which doesn't exist in portfolio)
        self.domains = [
            {"domain": "prompt.fail", "email": "claube@prompt.fail"},
            {"domain": "4site.pro", "email": "projects@4site.pro"},
            {"domain": "aegntic.ai", "email": "human@aegntic.ai"},
            {"domain": "ae.ltd", "email": "human@ae.ltd"},
            {"domain": "ultraplan.pro", "email": "vibe@ultraplan.pro"},
            {"domain": "aegnt27.xyz", "email": "auth@aegnt27.xyz"},
            {"domain": "dailydoco.com", "email": "docs@dailydoco.com"},
            {"domain": "credability.pro", "email": "verify@credability.pro"},
            {"domain": "mattaecooper.org", "email": "human@mattaecooper.org"},
            {"domain": "skool.food", "email": "chef@skool.food"},
            {"domain": "1minskool.com", "email": "learn@1minskool.com"}
        ]
    
    def get_dns_records(self, domain):
        """Get existing DNS records for a domain"""
        try:
            response = requests.post(
                f"{self.base_url}/dns/retrieve/{domain}",
                json={
                    "secretapikey": self.secret_key,
                    "apikey": self.api_key
                }
            )
            return response.json() if response.status_code == 200 else None
        except Exception as e:
            print(f"❌ Error getting DNS records for {domain}: {e}")
            return None
    
    def add_mx_record(self, domain, priority=10, content="mx1.forwardemail.net"):
        """Add MX record for email forwarding"""
        try:
            response = requests.post(
                f"{self.base_url}/dns/create/{domain}",
                json={
                    "secretapikey": self.secret_key,
                    "apikey": self.api_key,
                    "name": "",  # Root domain
                    "type": "MX",
                    "content": content,
                    "prio": str(priority),
                    "ttl": "600"
                }
            )
            return response.json() if response.status_code == 200 else None
        except Exception as e:
            print(f"❌ Error adding MX record for {domain}: {e}")
            return None
    
    def add_txt_record(self, domain, username):
        """Add TXT record for Forward Email configuration"""
        try:
            response = requests.post(
                f"{self.base_url}/dns/create/{domain}",
                json={
                    "secretapikey": self.secret_key,
                    "apikey": self.api_key,
                    "name": "",  # Root domain
                    "type": "TXT",
                    "content": f"forward-email={username}:{self.target_email}",
                    "ttl": "600"
                }
            )
            return response.json() if response.status_code == 200 else None
        except Exception as e:
            print(f"❌ Error adding TXT record for {domain}: {e}")
            return None
    
    def setup_domain_email_forwarding(self, domain_config):
        """Set up complete email forwarding for a domain"""
        domain = domain_config["domain"]
        email = domain_config["email"]
        username = email.split('@')[0]
        
        print(f"🔧 Setting up email forwarding for {email} → {self.target_email}")
        
        success_count = 0
        
        # Add MX records for Forward Email
        mx_servers = [
            ("mx1.forwardemail.net", 10),
            ("mx2.forwardemail.net", 20)
        ]
        
        for mx_server, priority in mx_servers:
            result = self.add_mx_record(domain, priority, mx_server)
            if result and result.get('status') == 'SUCCESS':
                print(f"✅ Added MX record: {mx_server} (Priority {priority})")
                success_count += 1
            else:
                print(f"⚠️ Failed to add MX record {mx_server}: {result}")
        
        # Add TXT record for email forwarding
        txt_result = self.add_txt_record(domain, username)
        if txt_result and txt_result.get('status') == 'SUCCESS':
            print(f"✅ Added TXT record for {username} → {self.target_email}")
            success_count += 1
        else:
            print(f"⚠️ Failed to add TXT record: {txt_result}")
        
        return success_count > 0
    
    def run_email_automation(self):
        """Run email forwarding setup for all domains"""
        print("🚀 STARTING PORKBUN EMAIL FORWARDING AUTOMATION")
        print("=" * 60)
        print(f"📧 Target Email: {self.target_email}")
        print(f"🌐 Domains to Configure: {len(self.domains)}")
        print("=" * 60)
        
        successful_domains = 0
        
        for i, domain_config in enumerate(self.domains, 1):
            domain = domain_config["domain"]
            print(f"\n🔄 [{i}/{len(self.domains)}] Processing {domain}...")
            
            success = self.setup_domain_email_forwarding(domain_config)
            if success:
                successful_domains += 1
                print(f"✅ {domain} configured successfully!")
            else:
                print(f"❌ {domain} configuration failed!")
            
            # Rate limiting
            time.sleep(2)
        
        print("\n" + "=" * 60)
        print("📊 AUTOMATION COMPLETE!")
        print("=" * 60)
        print(f"✅ Successfully configured: {successful_domains}/{len(self.domains)} domains")
        print(f"📧 All emails will forward to: {self.target_email}")
        
        print("\n🎯 Next Steps:")
        print("1. Wait 5-10 minutes for DNS propagation")
        print("2. Test email forwarding by sending to each address")
        print("3. Add Send As addresses in Gmail")
        print("4. Verify each Send As address")
        
        print("\n📋 Email Addresses Configured:")
        for domain_config in self.domains:
            print(f"   • {domain_config['email']}")
        
        return successful_domains

def main():
    """Main execution"""
    automator = PorkbunEmailSetup()
    automator.run_email_automation()

if __name__ == "__main__":
    main()