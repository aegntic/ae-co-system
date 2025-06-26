# ULTRAPLAN Implementation Guide

## Quick Start Development Setup

### Prerequisites
- Node.js 20 LTS
- PostgreSQL 15
- Redis 7
- Docker & Docker Compose
- Chrome/Firefox for extension testing

### 1. Extension Development Setup

```bash
# Clone and setup
cd ultraplan-extension
npm install

# Development build with hot reload
npm run dev

# Load unpacked extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

### 2. Web Application Setup

```bash
# Backend setup
cd ultraplan-webapp/backend
npm install
cp .env.example .env
# Edit .env with your API keys

# Database setup
docker-compose up -d postgres redis
npm run db:migrate
npm run db:seed

# Start backend
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

### 3. Essential Environment Variables

```env
# Backend .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/ultraplan
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=32-character-key

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Auth0 (optional)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...

# Frontend .env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Development Workflow

### 1. Feature Development Process

```bash
# Create feature branch
git checkout -b feature/your-feature

# Install dependencies if needed
npm install

# Run tests before committing
npm test
npm run lint

# Commit with conventional commits
git commit -m "feat: add project analysis endpoint"
```

### 2. Testing Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- ProjectAnalyzer

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### 3. Building for Production

```bash
# Extension build
cd ultraplan-extension
npm run build
# Output in dist/ ready for Chrome Web Store

# Web app build
cd ultraplan-webapp
npm run build:all
# Creates optimized builds in dist/

# Docker build
docker-compose -f docker-compose.prod.yml build
```

## API Integration Examples

### Extension to Web App Communication

```typescript
// In extension background script
async function analyzeProject(repoUrl: string) {
  const response = await fetch('https://api.ultraplan.ai/extension/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ repoUrl })
  });
  
  const { jobId } = await response.json();
  
  // Poll for results
  return pollForResults(jobId);
}

// In web app
app.post('/api/extension/analyze', authenticate, async (req, res) => {
  const { repoUrl } = req.body;
  const jobId = await queueAnalysisJob(repoUrl, req.user.id);
  
  res.json({ jobId });
});
```

### AI Plan Generation

```typescript
// Generate plan using AI
async function generatePlan(projectId: string) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  const analysis = project.analysis_data;
  
  const plan = await aiEngine.generatePlan({
    problems: analysis.problems,
    structure: analysis.structure,
    parameters: {
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 4000
    }
  });
  
  return db.plan.create({
    data: {
      project_id: projectId,
      ...plan
    }
  });
}
```

## Deployment Guide

### 1. Production Deployment Checklist

- [ ] Set all production environment variables
- [ ] Enable SSL/TLS certificates
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure error tracking (Sentry)
- [ ] Set up backup strategy
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Set up CI/CD pipeline

### 2. Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace ultraplan

# Apply secrets
kubectl apply -f k8s/secrets.yaml -n ultraplan

# Deploy services
kubectl apply -f k8s/ -n ultraplan

# Check deployment status
kubectl get pods -n ultraplan
kubectl get services -n ultraplan
```

### 3. Monitoring Setup

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ultraplan-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
    
  - job_name: 'ultraplan-frontend'
    static_configs:
      - targets: ['frontend:80']
```

## Security Best Practices

### 1. API Security

```typescript
// Rate limiting middleware
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

### 2. Data Protection

```typescript
// Encrypt sensitive data before storage
const encryptedData = await encryptionService.encrypt(sensitiveData);
await db.storedData.create({
  data: {
    encrypted_content: encryptedData,
    user_id: userId
  }
});

// Sanitize user input
const sanitizedInput = validator.escape(userInput);
```

## Troubleshooting

### Common Issues

1. **Extension not loading**
   - Check manifest.json for errors
   - Ensure all permissions are correctly specified
   - Check Chrome console for errors

2. **Database connection failed**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

3. **AI generation failing**
   - Verify API keys are valid
   - Check rate limits
   - Monitor token usage

### Debug Mode

```bash
# Enable debug logging
export DEBUG=ultraplan:*
export NODE_ENV=development
export LOG_LEVEL=debug

# Run with verbose logging
npm run dev:debug
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Redis caching for expensive operations
const cacheKey = `analysis:${projectId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await expensiveAnalysis(projectId);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // Cache for 1 hour

return result;
```

### 2. Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_plans_project_created ON plans(project_id, created_at DESC);
CREATE INDEX idx_marketplace_search ON marketplace_items USING GIN(to_tsvector('english', title || ' ' || description));
```

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review error logs
   - Check system metrics
   - Update dependencies
   - Backup databases

2. **Monthly**
   - Security audit
   - Performance review
   - Cost analysis
   - User feedback review

3. **Quarterly**
   - Major version updates
   - Infrastructure review
   - Disaster recovery test

### Backup Strategy

```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/ultraplan-$(date +\%Y\%m\%d).sql.gz

# Upload to S3
aws s3 cp /backups/ultraplan-$(date +\%Y\%m\%d).sql.gz s3://ultraplan-backups/
```

## Support Resources

- Documentation: https://docs.ultraplan.ai
- API Reference: https://api.ultraplan.ai/docs
- Status Page: https://status.ultraplan.ai
- Support Email: support@ultraplan.ai
- Discord Community: https://discord.gg/ultraplan