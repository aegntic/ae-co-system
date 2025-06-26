#!/bin/bash
# Deploy aegntic.ai Website - TASK-054
# Ultra-tier website deployment with community features

set -e

echo "🚀 Deploying aegntic.ai Website"
echo "==============================="

# Configuration
DOMAIN="aegntic.ai"
SOURCE_DIR="aegnt-27-standalone/website"
DEPLOY_DIR="/var/www/${DOMAIN}"
NGINX_CONFIG="/etc/nginx/sites-available/${DOMAIN}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo" 
   exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Create deployment directory
print_status "Setting up deployment directory..."
mkdir -p "$DEPLOY_DIR"
cp -r "$SOURCE_DIR"/* "$DEPLOY_DIR"
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"

# Create nginx configuration
print_status "Configuring nginx..."
cat > "$NGINX_CONFIG" << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    root ${DEPLOY_DIR};
    index index.html;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Main site
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    # API endpoints for community features
    location /api/ {
        # Future: proxy to Node.js backend
        return 404;
    }
    
    # Security: Hide sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.md$ {
        deny all;
    }
}
EOF

# Enable site
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

print_success "Nginx configuration completed"

# SSL Certificate with Let's Encrypt
print_status "Setting up SSL certificate..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"

print_success "SSL certificate configured"

# Create community signup backend (basic)
print_status "Setting up community features..."
mkdir -p /opt/aegntic-backend
cat > /opt/aegntic-backend/signup.js << 'EOF'
// Basic community signup handler
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

const SIGNUPS_FILE = '/opt/aegntic-backend/signups.json';

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://aegntic.ai');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Community signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { email } = req.body;
        const signup = {
            email,
            timestamp: new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ip: req.ip
        };
        
        // Load existing signups
        let signups = [];
        try {
            const data = await fs.readFile(SIGNUPS_FILE, 'utf8');
            signups = JSON.parse(data);
        } catch (e) {
            // File doesn't exist yet
        }
        
        // Add new signup
        signups.push(signup);
        
        // Save signups
        await fs.writeFile(SIGNUPS_FILE, JSON.stringify(signups, null, 2));
        
        console.log('New signup:', signup);
        res.json({ success: true, message: 'Welcome to the aegnt-27 community!' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Community backend running on port ${PORT}`);
});
EOF

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install backend dependencies
cd /opt/aegntic-backend
npm init -y
npm install express

# Create systemd service for backend
cat > /etc/systemd/system/aegntic-backend.service << EOF
[Unit]
Description=Aegntic Community Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/aegntic-backend
ExecStart=/usr/bin/node signup.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable aegntic-backend
systemctl start aegntic-backend

# Update nginx to proxy API requests
sed -i 's|# Future: proxy to Node.js backend|proxy_pass http://127.0.0.1:3001;|' "$NGINX_CONFIG"
sed -i '/proxy_pass/a\        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;' "$NGINX_CONFIG"

nginx -t && systemctl reload nginx

# Setup analytics (basic)
print_status "Setting up analytics..."
mkdir -p /var/log/aegntic
cat > /opt/aegntic-backend/analytics.js << 'EOF'
// Basic analytics tracker
const fs = require('fs').promises;
const path = require('path');

async function logPageView(req) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        path: req.path,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        ip: req.ip
    };
    
    const logFile = `/var/log/aegntic/pageviews-${new Date().toISOString().split('T')[0]}.json`;
    const logLine = JSON.stringify(logEntry) + '\n';
    
    await fs.appendFile(logFile, logLine);
}

module.exports = { logPageView };
EOF

print_success "Community backend configured"

# Create deployment verification
print_status "Verifying deployment..."
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
    print_success "Website is live at https://$DOMAIN"
else
    print_warning "Website may not be responding correctly"
fi

# Create maintenance script
cat > /opt/aegntic-backend/maintenance.sh << 'EOF'
#!/bin/bash
# Daily maintenance for aegntic.ai

# Backup signups
cp /opt/aegntic-backend/signups.json "/opt/aegntic-backend/backups/signups-$(date +%Y%m%d).json" 2>/dev/null || true

# Rotate logs older than 30 days
find /var/log/aegntic -name "*.json" -mtime +30 -delete

# Generate daily stats
echo "$(date): $(wc -l /opt/aegntic-backend/signups.json 2>/dev/null | cut -d' ' -f1) total signups"
EOF

chmod +x /opt/aegntic-backend/maintenance.sh
mkdir -p /opt/aegntic-backend/backups

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/aegntic-backend/maintenance.sh") | crontab -

print_success "🎉 aegntic.ai website deployment completed!"
echo ""
echo "Website: https://$DOMAIN"
echo "API: https://$DOMAIN/api/health"
echo "Signups log: /opt/aegntic-backend/signups.json"
echo "Analytics: /var/log/aegntic/"
echo ""
echo "Next steps:"
echo "1. Point DNS records to this server"
echo "2. Test community signup functionality"
echo "3. Set up monitoring and alerts"
echo "4. Configure social media integrations"