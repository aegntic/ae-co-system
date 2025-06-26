# DailyDoco Pro - Docker Deployment Guide 🐳

## Overview

DailyDoco Pro is fully containerized for easy deployment across development, staging, and production environments. This guide covers everything from local development to production deployment.

## Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/dailydoco/dailydoco-pro.git
cd dailydoco-pro

# Run the automated installer
./install-dailydoco.sh

# Or manually with Docker Compose
docker-compose up -d

# Access the dashboard
open http://localhost:3000
```

## Architecture

### Services

1. **web-dashboard** (Port 3000) - React frontend with real-time monitoring
2. **api-server** (Port 8080) - Node.js backend with WebSocket support
3. **mcp-server** (Port 8081) - AI model coordination service
4. **desktop-engine** - Rust capture engine with GPU acceleration
5. **postgres** - TimescaleDB for metrics and data storage
6. **redis** - Caching and real-time pub/sub
7. **nginx** - Reverse proxy and load balancer

### Network Architecture

```
┌─────────────────┐
│     nginx:80    │ ← Public Entry Point
└────────┬────────┘
         │
    ┌────┴────┬───────┬─────────┐
    ▼         ▼       ▼         ▼
dashboard  api:8080  mcp:8081  health
  :3000       │         │
    │         │         │
    └─────────┴─────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
postgres:5432      redis:6379
```

## Development Setup

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB free disk space
- (Optional) NVIDIA GPU with drivers for hardware acceleration

### Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:
```env
# Database
POSTGRES_USER=dailydoco
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=dailydoco

# Redis
REDIS_PASSWORD=your_redis_password

# API Configuration
API_PORT=8080
API_SECRET=your_jwt_secret

# MCP Server
MCP_PORT=8081
OPENROUTER_API_KEY=your_openrouter_key

# Desktop Engine
CAPTURE_QUALITY=high
GPU_ACCELERATION=true
```

### Building and Running

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Production Deployment

### SSL Certificate Setup

1. **Option A: Self-Signed (Development)**
```bash
cd config/ssl
./generate-certs.sh
```

2. **Option B: Let's Encrypt (Production)**
```bash
# Install certbot
apt-get update && apt-get install certbot

# Generate certificates
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to config directory
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem config/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem config/ssl/key.pem
```

### Production Deployment

```bash
# Create secrets directory
mkdir -p secrets
echo "your_secure_password" > secrets/db_password.txt
chmod 600 secrets/db_password.txt

# Deploy with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services as needed
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale api-server=3
```

### Resource Requirements

| Service | CPU | Memory | Storage | GPU |
|---------|-----|--------|---------|-----|
| nginx | 0.5 | 512MB | - | - |
| web-dashboard | 1.0 | 1GB | - | - |
| api-server | 2.0 | 2GB | 10GB | - |
| mcp-server | 4.0 | 4GB | 5GB | Optional |
| desktop-engine | 4.0 | 4GB | 20GB | Recommended |
| postgres | 2.0 | 2GB | 50GB+ | - |
| redis | 1.0 | 1GB | 5GB | - |

**Total Minimum**: 14.5 CPU cores, 14.5GB RAM, 90GB storage

## Monitoring and Maintenance

### Health Checks

```bash
# Check service health
curl http://localhost/health

# View service status
docker-compose ps

# Check resource usage
docker stats
```

### Backup and Recovery

1. **Database Backup**
```bash
# Manual backup
docker-compose exec postgres pg_dump -U dailydoco dailydoco > backup.sql

# Automated daily backups (add to crontab)
0 2 * * * docker-compose exec -T postgres pg_dump -U dailydoco dailydoco > /backups/postgres/daily-$(date +\%Y\%m\%d).sql
```

2. **Volume Backup**
```bash
# Backup all volumes
docker run --rm -v dailydoco_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres-data.tar.gz /data
docker run --rm -v dailydoco_redis_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/redis-data.tar.gz /data
```

### Logging

Logs are automatically rotated with the following configuration:
- Maximum file size: 10MB
- Maximum files: 3-5 per service
- Location: `./logs/<service-name>/`

```bash
# View logs for specific service
docker-compose logs -f api-server

# Aggregate logs
tail -f logs/*/app.log
```

## Troubleshooting

### Common Issues

1. **GPU not detected**
```bash
# Verify NVIDIA runtime
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Install NVIDIA Docker runtime
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
apt-get update && apt-get install -y nvidia-docker2
systemctl restart docker
```

2. **Port conflicts**
```bash
# Check port usage
netstat -tlnp | grep -E ':(3000|8080|8081|5432|6379)'

# Change ports in .env file
WEB_PORT=3001
API_PORT=8082
```

3. **Memory issues**
```bash
# Increase Docker memory limit
# Edit Docker Desktop settings or /etc/docker/daemon.json
{
  "default-ulimits": {
    "memlock": {
      "Name": "memlock",
      "Hard": -1,
      "Soft": -1
    }
  }
}
```

### Performance Tuning

1. **PostgreSQL Optimization**
```sql
-- Connect to database
docker-compose exec postgres psql -U dailydoco

-- Tune for performance
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Reload configuration
SELECT pg_reload_conf();
```

2. **Redis Optimization**
```bash
# Edit redis configuration
docker-compose exec redis redis-cli
CONFIG SET maxmemory-policy allkeys-lru
CONFIG SET save ""
CONFIG REWRITE
```

## Security Best Practices

1. **Network Isolation**
   - Use Docker networks to isolate services
   - Only expose necessary ports through nginx
   - Enable firewall rules for production

2. **Secrets Management**
   - Never commit secrets to version control
   - Use Docker secrets for sensitive data
   - Rotate credentials regularly

3. **Updates and Patches**
   ```bash
   # Update base images regularly
   docker-compose pull
   docker-compose up -d
   ```

4. **Access Control**
   - Implement rate limiting in nginx
   - Use strong passwords for all services
   - Enable SSL/TLS for all external connections

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy DailyDoco Pro

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and push images
        run: |
          docker-compose build
          docker-compose push
      
      - name: Deploy to production
        run: |
          ssh ${{ secrets.PROD_HOST }} 'cd /opt/dailydoco && docker-compose pull && docker-compose up -d'
```

## Support and Resources

- 📚 Documentation: https://docs.dailydoco.pro
- 💬 Discord: https://discord.gg/dailydoco
- 🐛 Issues: https://github.com/dailydoco/dailydoco-pro/issues
- 📧 Email: support@dailydoco.pro

---

## Quick Reference

### Essential Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Execute command in container
docker-compose exec [service-name] [command]

# Update and restart
docker-compose pull && docker-compose up -d

# Clean up unused resources
docker system prune -a
```

### Service URLs

- Dashboard: http://localhost:3000
- API: http://localhost:8080/api
- WebSocket: ws://localhost:8080/ws
- MCP Server: http://localhost:8081/mcp
- Health Check: http://localhost/health

---

Built with ❤️ by the DailyDoco Team