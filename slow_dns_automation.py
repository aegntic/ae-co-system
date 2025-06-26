#!/usr/bin/env python3
"""
Slow DNS Automation with Extended Rate Limiting
Uses longer delays between API calls to avoid rate limiting
"""
import subprocess
import json
import time

class SlowDNSAutomation:
    def __init__(self):
        self.api_key = "pk1_c1ef1c487a138e4c3b8904b00fe8b85e6a24667935265a1567062eb88703f1a0"
        self.secret_key = "sk1_ad060b8068f5d1263846303394bf7449a19fe2628430c3b2f9ea73492969b915"
        self.base_url = "https://porkbun.com/api/json/v3"
        
        # Start with just the first 3 domains to test
        self.domains = [
            {"domain": "prompt.fail", "email": "claube@prompt.fail"},
            {"domain": "4site.pro", "email": "projects@4site.pro"},
            {"domain": "aegntic.ai", "email": "human@aegntic.ai"}
        ]
    
    def run_curl_command(self, domain, record_type, name, content, prio=None):
        """Execute curl command with improved error handling"""
        
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
        
        curl_cmd = [
            "curl", "-X", "POST",
            f"{self.base_url}/dns/create/{domain}",
            "-H", "Content-Type: application/json",
            "-d", json.dumps(data),
            "-s"  # Silent mode
        ]
        
        try:
            result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0 and result.stdout.strip():
                try:
                    response = json.loads(result.stdout)
                    return response
                except json.JSONDecodeError:
                    print(f"   ⚠️ Non-JSON response: {result.stdout[:100]}")
                    return {"status": "ERROR", "message": "Non-JSON response"}
            else:
                print(f"   ⚠️ Curl failed: {result.stderr}")
                return {"status": "ERROR", "message": "Curl command failed"}
                
        except Exception as e:
            print(f"   ❌ Exception: {e}")
            return {"status": "ERROR", "message": str(e)}
    
    def setup_single_domain(self, domain_config):
        """Set up DNS records for a single domain with extensive delays"""
        domain = domain_config["domain"]
        email = domain_config["email"]
        username = email.split('@')[0]
        
        print(f"\n🔧 Setting up {email} → aegntic@gmail.com")
        print(f"   Domain: {domain}")
        
        success_count = 0
        
        # MX Record 1
        print(f"   📡 Adding MX1 record...")
        result1 = self.run_curl_command(domain, "MX", "", "mx1.forwardemail.net", 10)
        if result1.get('status') == 'SUCCESS':
            print(f"   ✅ MX1 record added")
            success_count += 1
        else:
            print(f"   ❌ MX1 failed: {result1.get('message', 'Unknown error')}")
        
        # Wait between each API call
        print(f"   ⏰ Waiting 10 seconds...")
        time.sleep(10)
        
        # MX Record 2
        print(f"   📡 Adding MX2 record...")
        result2 = self.run_curl_command(domain, "MX", "", "mx2.forwardemail.net", 20)
        if result2.get('status') == 'SUCCESS':
            print(f"   ✅ MX2 record added")
            success_count += 1
        else:
            print(f"   ❌ MX2 failed: {result2.get('message', 'Unknown error')}")
        
        # Wait between each API call
        print(f"   ⏰ Waiting 10 seconds...")
        time.sleep(10)
        
        # TXT Record
        print(f"   📡 Adding TXT record...")
        txt_content = f"forward-email={username}:aegntic@gmail.com"
        result3 = self.run_curl_command(domain, "TXT", "", txt_content)
        if result3.get('status') == 'SUCCESS':
            print(f"   ✅ TXT record added")
            success_count += 1
        else:
            print(f"   ❌ TXT failed: {result3.get('message', 'Unknown error')}")
        
        return success_count >= 2  # At least MX records successful
    
    def run_slow_automation(self):
        """Run automation with extensive delays"""
        print("🐌 SLOW DNS AUTOMATION (RATE LIMIT FRIENDLY)")
        print("=" * 60)
        print(f"🌐 Testing with {len(self.domains)} domains first")
        print("⏰ Using 10-second delays between API calls")
        print("=" * 60)
        
        successful_domains = 0
        
        for i, domain_config in enumerate(self.domains, 1):
            print(f"\n[{i}/{len(self.domains)}] Processing {domain_config['domain']}")
            
            success = self.setup_single_domain(domain_config)
            if success:
                successful_domains += 1
                print(f"✅ {domain_config['domain']} configured successfully!")
            else:
                print(f"❌ {domain_config['domain']} configuration failed!")
            
            # Long delay between domains
            if i < len(self.domains):
                print(f"\n⏰ Waiting 30 seconds before next domain...")
                time.sleep(30)
        
        print("\n" + "=" * 60)
        print("📊 SLOW AUTOMATION COMPLETE")
        print("=" * 60)
        print(f"✅ Successfully configured: {successful_domains}/{len(self.domains)} domains")
        
        if successful_domains > 0:
            print("\n🎯 Next Steps:")
            print("1. Wait 5-10 minutes for DNS propagation")
            print("2. Test email forwarding")
            print("3. Run full automation for remaining domains")
        
        return successful_domains

def main():
    """Main execution"""
    automator = SlowDNSAutomation()
    automator.run_slow_automation()

if __name__ == "__main__":
    main()