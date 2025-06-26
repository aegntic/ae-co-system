#!/usr/bin/env python3
"""
Direct Porkbun DNS API Script
Using curl commands to set up DNS records for email forwarding
"""
import subprocess
import json
import time

class DirectPorkbunSetup:
    def __init__(self):
        self.api_key = "pk1_c1ef1c487a138e4c3b8904b00fe8b85e6a24667935265a1567062eb88703f1a0"
        self.secret_key = "sk1_ad060b8068f5d1263846303394bf7449a19fe2628430c3b2f9ea73492969b915"
        self.base_url = "https://porkbun.com/api/json/v3"
        
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
    
    def run_curl_command(self, domain, record_type, name, content, prio=None):
        """Execute curl command to create DNS record"""
        
        data = {
            "secretapikey": self.secret_key,
            "apikey": self.api_key,
            "name": name,
            "type": record_type,
            "content": content,
            "ttl": "600"
        }
        
        if prio:
            data["prio"] = str(prio)
        
        # Prepare curl command
        curl_cmd = [
            "curl", "-X", "POST",
            f"{self.base_url}/dns/create/{domain}",
            "-H", "Content-Type: application/json",
            "-d", json.dumps(data)
        ]
        
        try:
            result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                response = json.loads(result.stdout)
                return response
            else:
                print(f"❌ Curl command failed: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"❌ Error executing curl: {e}")
            return None
    
    def setup_domain_forwarding(self, domain_config):
        """Set up email forwarding for a single domain"""
        domain = domain_config["domain"]
        email = domain_config["email"]
        username = email.split('@')[0]
        target = "aegntic@gmail.com"
        
        print(f"\n🔧 Setting up {email} → {target}")
        
        success_count = 0
        
        # Create MX records
        mx_records = [
            ("mx1.forwardemail.net", 10),
            ("mx2.forwardemail.net", 20)
        ]
        
        for mx_server, priority in mx_records:
            print(f"   Adding MX record: {mx_server} (Priority {priority})")
            result = self.run_curl_command(domain, "MX", "", mx_server, priority)
            
            if result and result.get('status') == 'SUCCESS':
                print(f"   ✅ MX record added successfully")
                success_count += 1
            else:
                print(f"   ❌ Failed to add MX record: {result}")
        
        # Create TXT record for forwarding
        print(f"   Adding TXT record: forward-email={username}:{target}")
        txt_content = f"forward-email={username}:{target}"
        result = self.run_curl_command(domain, "TXT", "", txt_content)
        
        if result and result.get('status') == 'SUCCESS':
            print(f"   ✅ TXT record added successfully")
            success_count += 1
        else:
            print(f"   ❌ Failed to add TXT record: {result}")
        
        return success_count > 0
    
    def run_automation(self):
        """Run the complete DNS automation"""
        print("🚀 DIRECT PORKBUN DNS AUTOMATION")
        print("=" * 60)
        print(f"🌐 Domains: {len(self.domains)}")
        print("=" * 60)
        
        successful_domains = 0
        
        for i, domain_config in enumerate(self.domains, 1):
            print(f"\n[{i}/{len(self.domains)}] Processing {domain_config['domain']}")
            
            success = self.setup_domain_forwarding(domain_config)
            if success:
                successful_domains += 1
                print(f"✅ {domain_config['domain']} configured successfully")
            else:
                print(f"❌ {domain_config['domain']} configuration failed")
            
            # Rate limiting
            time.sleep(2)
        
        print("\n" + "=" * 60)
        print("📊 AUTOMATION COMPLETE")
        print("=" * 60)
        print(f"✅ Successfully configured: {successful_domains}/{len(self.domains)} domains")
        
        if successful_domains > 0:
            print("\n🎯 Next Steps:")
            print("1. Wait 5-10 minutes for DNS propagation")
            print("2. Test email forwarding by sending test emails")
            print("3. Add Send As addresses in Gmail")
            print("4. Verify each Send As address")
        
        return successful_domains

def main():
    """Main execution"""
    automator = DirectPorkbunSetup()
    automator.run_automation()

if __name__ == "__main__":
    main()