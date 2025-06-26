# 07 - DNS Domain Configuration for 4site.pro

## Objective
Configure complete DNS infrastructure for 4site.pro with automated SSL certificates and global CDN distribution.

## Domain Architecture
- **Primary**: `4site.pro` → React frontend application
- **API**: `api.4site.pro` → Express.js backend services  
- **CDN**: `cdn.4site.pro` → Static assets and media files
- **Admin**: `admin.4site.pro` → Administrative dashboard

## Required Files to Create

### 1. DNS Configuration File
**File**: `dns-config.json`
```json
{
  "domain": "4site.pro",
  "provider": "cloudflare",
  "records": [
    {
      "type": "A",
      "name": "@",
      "value": "YOUR-FRONTEND-IP-HERE",
      "ttl": 300,
      "proxied": true
    },
    {
      "type": "A", 
      "name": "api",
      "value": "YOUR-API-IP-HERE",
      "ttl": 300,
      "proxied": true
    },
    {
      "type": "CNAME",
      "name": "cdn",
      "value": "YOUR-CDN-DOMAIN-HERE",
      "ttl": 300,
      "proxied": true
    },
    {
      "type": "A",
      "name": "admin", 
      "value": "YOUR-ADMIN-IP-HERE",
      "ttl": 300,
      "proxied": true
    },
    {
      "type": "TXT",
      "name": "@",
      "value": "v=spf1 include:_spf.google.com ~all",
      "ttl": 300
    }
  ],
  "ssl": {
    "enabled": true,
    "provider": "letsencrypt",
    "autoRenewal": true
  }
}
```

### 2. DNS Setup Automation Script
**File**: `setup-dns.sh`
```bash
#!/bin/bash

# DNS Domain Setup for 4site.pro
set -e

echo "🚀 Setting up DNS configuration for 4site.pro..."

# Load configuration
CONFIG_FILE="dns-config.json"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-YOUR-CLOUDFLARE-TOKEN-HERE}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:-YOUR-ZONE-ID-HERE}"

# Validate required environment variables
if [[ -z "$CLOUDFLARE_API_TOKEN" || "$CLOUDFLARE_API_TOKEN" == "YOUR-CLOUDFLARE-TOKEN-HERE" ]]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN not set"
    exit 1
fi

if [[ -z "$ZONE_ID" || "$ZONE_ID" == "YOUR-ZONE-ID-HERE" ]]; then
    echo "❌ Error: CLOUDFLARE_ZONE_ID not set"
    exit 1
fi

# Function to create DNS record
create_dns_record() {
    local record_type=$1
    local record_name=$2
    local record_value=$3
    local ttl=$4
    local proxied=$5
    
    echo "📍 Creating $record_type record: $record_name → $record_value"
    
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"type\": \"$record_type\",
            \"name\": \"$record_name\",
            \"content\": \"$record_value\",
            \"ttl\": $ttl,
            \"proxied\": $proxied
        }" | jq .
}

# Create all DNS records from config
echo "📝 Reading DNS configuration..."
while IFS= read -r record; do
    type=$(echo "$record" | jq -r '.type')
    name=$(echo "$record" | jq -r '.name')
    value=$(echo "$record" | jq -r '.value')
    ttl=$(echo "$record" | jq -r '.ttl')
    proxied=$(echo "$record" | jq -r '.proxied // false')
    
    if [[ "$value" == *"YOUR-"*"-HERE" ]]; then
        echo "⚠️  Skipping $name - placeholder value detected: $value"
        continue
    fi
    
    create_dns_record "$type" "$name" "$value" "$ttl" "$proxied"
    sleep 2
done < <(jq -c '.records[]' "$CONFIG_FILE")

echo "✅ DNS configuration complete!"
echo "🔍 Verifying DNS propagation..."
./validate-dns.sh
```

### 3. SSL Certificate Setup Script
**File**: `ssl-setup.sh`
```bash
#!/bin/bash

# SSL Certificate Setup for 4site.pro
set -e

echo "🔒 Setting up SSL certificates for 4site.pro..."

DOMAIN="4site.pro"
EMAIL="${SSL_EMAIL:-admin@4site.pro}"
STAGING="${STAGING:-false}"

# Domains to secure
DOMAINS=(
    "$DOMAIN"
    "api.$DOMAIN"
    "cdn.$DOMAIN" 
    "admin.$DOMAIN"
)

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-dns-cloudflare
fi

# Create Cloudflare credentials file
echo "📝 Creating Cloudflare credentials..."
cat > ~/.cloudflare.ini << EOF
dns_cloudflare_api_token = ${CLOUDFLARE_API_TOKEN:-YOUR-CLOUDFLARE-TOKEN-HERE}
EOF
chmod 600 ~/.cloudflare.ini

# Generate certificate for all domains
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

if [[ "$STAGING" == "true" ]]; then
    STAGING_ARG="--staging"
    echo "🧪 Using Let's Encrypt staging environment"
else
    STAGING_ARG=""
    echo "🌟 Using Let's Encrypt production environment"
fi

echo "🔐 Requesting SSL certificate..."
sudo certbot certonly \
    --dns-cloudflare \
    --dns-cloudflare-credentials ~/.cloudflare.ini \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    $STAGING_ARG \
    $DOMAIN_ARGS

# Set up auto-renewal
echo "🔄 Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "✅ SSL certificates configured successfully!"
echo "📋 Certificate locations:"
echo "   - Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "   - Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
```

### 4. DNS Validation Script
**File**: `validate-dns.sh`
```bash
#!/bin/bash

# DNS Validation for 4site.pro
set -e

echo "🔍 Validating DNS configuration for 4site.pro..."

DOMAIN="4site.pro"
SUBDOMAINS=("" "api" "cdn" "admin")

# Function to check DNS resolution
check_dns() {
    local subdomain=$1
    local full_domain="${subdomain:+$subdomain.}$DOMAIN"
    
    echo "🌐 Checking $full_domain..."
    
    # Check A record resolution
    if ip=$(dig +short "$full_domain" A); then
        if [[ -n "$ip" ]]; then
            echo "  ✅ A record: $ip"
        else
            echo "  ❌ No A record found"
            return 1
        fi
    else
        echo "  ❌ DNS resolution failed"
        return 1
    fi
    
    # Check HTTPS certificate
    if timeout 10 openssl s_client -connect "$full_domain:443" -servername "$full_domain" < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo "  ✅ SSL certificate valid"
    else
        echo "  ⚠️  SSL certificate issue or not yet propagated"
    fi
    
    # Check HTTP response
    if response=$(curl -s -w "%{http_code}" -o /dev/null "https://$full_domain" --max-time 10); then
        if [[ "$response" == "200" || "$response" == "301" || "$response" == "302" ]]; then
            echo "  ✅ HTTP response: $response"
        else
            echo "  ⚠️  HTTP response: $response"
        fi
    else
        echo "  ❌ HTTP request failed"
    fi
    
    echo ""
}

# Check all domains
all_passed=true
for subdomain in "${SUBDOMAINS[@]}"; do
    if ! check_dns "$subdomain"; then
        all_passed=false
    fi
done

# Global DNS propagation check
echo "🌍 Checking global DNS propagation..."
for subdomain in "${SUBDOMAINS[@]}"; do
    full_domain="${subdomain:+$subdomain.}$DOMAIN"
    echo "📡 $full_domain global propagation:"
    curl -s "https://www.whatsmydns.net/api/check?server=google&type=A&query=$full_domain" | jq -r '.[] | "  \(.country): \(.response // "No response")"' | head -5
    echo ""
done

if [[ "$all_passed" == "true" ]]; then
    echo "✅ All DNS validations passed!"
    exit 0
else
    echo "❌ Some DNS validations failed. Check configuration and try again."
    exit 1
fi
```

### 5. Cloudflare API Configuration
**File**: `cloudflare-config.js`
```javascript
// Cloudflare API Configuration for 4site.pro
const axios = require('axios');

class CloudflareManager {
    constructor(apiToken, zoneId) {
        this.apiToken = apiToken || process.env.CLOUDFLARE_API_TOKEN || 'YOUR-CLOUDFLARE-TOKEN-HERE';
        this.zoneId = zoneId || process.env.CLOUDFLARE_ZONE_ID || 'YOUR-ZONE-ID-HERE';
        this.baseURL = 'https://api.cloudflare.com/client/v4';
        
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async listDNSRecords() {
        try {
            const response = await this.client.get(`/zones/${this.zoneId}/dns_records`);
            return response.data.result;
        } catch (error) {
            console.error('Error listing DNS records:', error.response?.data || error.message);
            throw error;
        }
    }

    async createDNSRecord(record) {
        try {
            const response = await this.client.post(`/zones/${this.zoneId}/dns_records`, record);
            console.log(`✅ Created ${record.type} record: ${record.name} → ${record.content}`);
            return response.data.result;
        } catch (error) {
            console.error(`❌ Error creating ${record.type} record for ${record.name}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async updateDNSRecord(recordId, updates) {
        try {
            const response = await this.client.patch(`/zones/${this.zoneId}/dns_records/${recordId}`, updates);
            console.log(`✅ Updated DNS record: ${updates.name || 'record'}`);
            return response.data.result;
        } catch (error) {
            console.error('Error updating DNS record:', error.response?.data || error.message);
            throw error;
        }
    }

    async deleteDNSRecord(recordId) {
        try {
            await this.client.delete(`/zones/${this.zoneId}/dns_records/${recordId}`);
            console.log('✅ Deleted DNS record');
        } catch (error) {
            console.error('Error deleting DNS record:', error.response?.data || error.message);
            throw error;
        }
    }

    async setupDomainSecurity() {
        console.log('🔒 Setting up domain security...');
        
        // Enable HTTPS redirect
        await this.updateZoneSetting('always_use_https', 'on');
        
        // Enable HSTS
        await this.updateZoneSetting('security_header', {
            strict_transport_security: {
                enabled: true,
                max_age: 63072000,
                include_subdomains: true,
                nosniff: true
            }
        });
        
        // Enable DDoS protection
        await this.updateZoneSetting('ddos_protection', 'on');
        
        console.log('✅ Domain security configured');
    }

    async updateZoneSetting(setting, value) {
        try {
            await this.client.patch(`/zones/${this.zoneId}/settings/${setting}`, { value });
            console.log(`✅ Updated ${setting} setting`);
        } catch (error) {
            console.error(`❌ Error updating ${setting}:`, error.response?.data || error.message);
        }
    }
}

module.exports = CloudflareManager;

// Example usage
if (require.main === module) {
    const cf = new CloudflareManager();
    
    // Configuration for 4site.pro
    const dnsRecords = [
        {
            type: 'A',
            name: '4site.pro',
            content: 'YOUR-FRONTEND-IP-HERE',
            ttl: 300,
            proxied: true
        },
        {
            type: 'A',
            name: 'api.4site.pro',
            content: 'YOUR-API-IP-HERE',
            ttl: 300,
            proxied: true
        },
        {
            type: 'CNAME',
            name: 'cdn.4site.pro',
            content: 'YOUR-CDN-DOMAIN-HERE',
            ttl: 300,
            proxied: true
        }
    ];
    
    (async () => {
        try {
            console.log('🚀 Starting DNS configuration...');
            
            for (const record of dnsRecords) {
                if (record.content.includes('YOUR-') && record.content.includes('-HERE')) {
                    console.log(`⚠️  Skipping ${record.name} - placeholder value`);
                    continue;
                }
                await cf.createDNSRecord(record);
            }
            
            await cf.setupDomainSecurity();
            console.log('✅ DNS configuration complete!');
            
        } catch (error) {
            console.error('❌ DNS configuration failed:', error.message);
            process.exit(1);
        }
    })();
}
```

## Environment Variables Required

Create `.env.dns` file:
```bash
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=YOUR-CLOUDFLARE-TOKEN-HERE
CLOUDFLARE_ZONE_ID=YOUR-ZONE-ID-HERE

# Domain Configuration  
DOMAIN=4site.pro
SSL_EMAIL=admin@4site.pro

# Server IPs (replace with actual values)
FRONTEND_IP=YOUR-FRONTEND-IP-HERE
API_IP=YOUR-API-IP-HERE
CDN_DOMAIN=YOUR-CDN-DOMAIN-HERE
ADMIN_IP=YOUR-ADMIN-IP-HERE

# SSL Configuration
STAGING=false
```

## Execution Instructions

1. **Install Dependencies**:
   ```bash
   npm install axios
   sudo apt-get install jq dig curl certbot python3-certbot-dns-cloudflare
   ```

2. **Configure Environment**:
   ```bash
   cp .env.dns.example .env.dns
   # Edit .env.dns with actual values
   source .env.dns
   ```

3. **Make Scripts Executable**:
   ```bash
   chmod +x setup-dns.sh ssl-setup.sh validate-dns.sh
   ```

4. **Execute DNS Setup**:
   ```bash
   ./setup-dns.sh
   ./ssl-setup.sh
   ./validate-dns.sh
   ```

## Success Criteria
- ✅ All subdomains resolve correctly
- ✅ SSL certificates installed and valid
- ✅ HTTPS redirect enabled
- ✅ Global DNS propagation confirmed
- ✅ Security headers configured

## Troubleshooting
- **DNS not propagating**: Wait 5-10 minutes, check TTL values
- **SSL certificate issues**: Verify Cloudflare API token permissions
- **HTTP errors**: Check server configurations and firewall rules