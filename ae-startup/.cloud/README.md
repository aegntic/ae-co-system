# Reusable Code Snippets & Patterns

This directory stores reusable code snippets, patterns, and automation scripts for efficient AI-assisted development in the ae-co-system.

## Purpose

The `.cloud/` folder contains battle-tested code patterns, configuration templates, and automation scripts that can be quickly adapted and reused across different components and projects.

## Structure

### Core Categories

#### Code Patterns (`patterns/`)
- Design pattern implementations
- Common algorithm solutions
- Reusable component templates
- Architecture pattern examples

#### Configuration Templates (`config/`)
- Development environment configurations
- Deployment configuration templates
- CI/CD pipeline templates
- Database migration templates

#### Automation Scripts (`scripts/`)
- Development workflow automation
- Build and deployment scripts
- Testing automation utilities
- Maintenance and monitoring scripts

#### Communication Templates (`communication/`)
- Email templates for stakeholder updates
- Documentation templates
- Status report formats
- Meeting agenda templates

#### Quick Utilities (`utilities/`)
- Helper functions and utilities
- Data transformation scripts
- Validation and testing utilities
- Development tools and shortcuts

## Code Pattern Templates

### Python FastAPI Endpoint Pattern
```python
# patterns/fastapi-endpoint-template.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

# Router setup
router = APIRouter(prefix="/api/v1", tags=["resource"])
logger = logging.getLogger(__name__)

# Request/Response models
class ResourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ResourceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

# Endpoint with full error handling
@router.post("/resources", response_model=ResourceResponse)
async def create_resource(
    resource: ResourceCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new resource with full validation and error handling.
    
    - **name**: Resource name (required, 1-100 chars)
    - **description**: Optional description (max 500 chars)
    """
    try:
        # Validation
        if await resource_exists(resource.name):
            raise HTTPException(
                status_code=400,
                detail="Resource with this name already exists"
            )
        
        # Business logic
        new_resource = await create_resource_service(resource, current_user.id)
        
        # Logging
        logger.info(f"Resource created: {new_resource.id} by user {current_user.id}")
        
        return new_resource
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Query endpoint with pagination
@router.get("/resources", response_model=List[ResourceResponse])
async def list_resources(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, max_length=100),
    current_user: User = Depends(get_current_user)
):
    """List resources with pagination and search."""
    return await get_resources_service(skip, limit, search, current_user.id)
```

### TypeScript React Component Pattern
```typescript
// patterns/react-component-template.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Types
interface ResourceData {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ResourceFormData {
  name: string;
  description?: string;
}

// Props interface
interface ResourceManagerProps {
  className?: string;
  onResourceCreate?: (resource: ResourceData) => void;
  onResourceUpdate?: (resource: ResourceData) => void;
  onResourceDelete?: (resourceId: number) => void;
}

// Custom hooks
const useResources = () => {
  return useQuery({
    queryKey: ['resources'],
    queryFn: () => fetch('/api/v1/resources').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const useCreateResource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ResourceFormData) =>
      fetch('/api/v1/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create resource: ${error.message}`);
    },
  });
};

// Main component
export const ResourceManager: React.FC<ResourceManagerProps> = ({
  className = '',
  onResourceCreate,
  onResourceUpdate,
  onResourceDelete,
}) => {
  // State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceData | null>(null);

  // Queries and mutations
  const { data: resources, isLoading, error } = useResources();
  const createResourceMutation = useCreateResource();

  // Handlers
  const handleCreateResource = useCallback(async (formData: ResourceFormData) => {
    try {
      const newResource = await createResourceMutation.mutateAsync(formData);
      onResourceCreate?.(newResource);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to create resource:', error);
    }
  }, [createResourceMutation, onResourceCreate]);

  const handleEditResource = useCallback((resource: ResourceData) => {
    setSelectedResource(resource);
    setIsFormOpen(true);
  }, []);

  // Effects
  useEffect(() => {
    if (error) {
      toast.error('Failed to load resources');
    }
  }, [error]);

  // Loading state
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-red-500 p-4">Error loading resources</div>;
  }

  return (
    <div className={`resource-manager ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Resources</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Resource
        </button>
      </div>

      {/* Resource list */}
      <div className="grid gap-4">
        {resources?.map((resource: ResourceData) => (
          <div
            key={resource.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{resource.name}</h3>
                {resource.description && (
                  <p className="text-gray-600 mt-1">{resource.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditResource(resource)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onResourceDelete?.(resource.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {isFormOpen && (
        <ResourceForm
          resource={selectedResource}
          onSubmit={handleCreateResource}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedResource(null);
          }}
        />
      )}
    </div>
  );
};

export default ResourceManager;
```

### Rust Service Pattern
```rust
// patterns/rust-service-template.rs
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error, warn};

// Domain types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resource {
    pub id: u64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateResourceRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateResourceRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

// Repository trait for data access
#[async_trait::async_trait]
pub trait ResourceRepository: Send + Sync {
    async fn create(&self, request: CreateResourceRequest) -> Result<Resource>;
    async fn get_by_id(&self, id: u64) -> Result<Option<Resource>>;
    async fn list(&self, limit: u32, offset: u32) -> Result<Vec<Resource>>;
    async fn update(&self, id: u64, request: UpdateResourceRequest) -> Result<Option<Resource>>;
    async fn delete(&self, id: u64) -> Result<bool>;
}

// Service implementation
pub struct ResourceService {
    repository: Arc<dyn ResourceRepository>,
    cache: Arc<RwLock<std::collections::HashMap<u64, Resource>>>,
}

impl ResourceService {
    pub fn new(repository: Arc<dyn ResourceRepository>) -> Self {
        Self {
            repository,
            cache: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    pub async fn create_resource(&self, request: CreateResourceRequest) -> Result<Resource> {
        // Validation
        if request.name.trim().is_empty() {
            return Err(anyhow::anyhow!("Resource name cannot be empty"));
        }

        if request.name.len() > 100 {
            return Err(anyhow::anyhow!("Resource name cannot exceed 100 characters"));
        }

        // Business logic
        let resource = self
            .repository
            .create(request)
            .await
            .context("Failed to create resource")?;

        // Update cache
        {
            let mut cache = self.cache.write().await;
            cache.insert(resource.id, resource.clone());
        }

        info!("Resource created: {}", resource.id);
        Ok(resource)
    }

    pub async fn get_resource(&self, id: u64) -> Result<Option<Resource>> {
        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some(resource) = cache.get(&id) {
                return Ok(Some(resource.clone()));
            }
        }

        // Fetch from repository
        let resource = self
            .repository
            .get_by_id(id)
            .await
            .context("Failed to fetch resource")?;

        // Update cache if found
        if let Some(ref res) = resource {
            let mut cache = self.cache.write().await;
            cache.insert(id, res.clone());
        }

        Ok(resource)
    }

    pub async fn list_resources(&self, limit: u32, offset: u32) -> Result<Vec<Resource>> {
        // Validate parameters
        if limit == 0 || limit > 1000 {
            return Err(anyhow::anyhow!("Limit must be between 1 and 1000"));
        }

        self.repository
            .list(limit, offset)
            .await
            .context("Failed to list resources")
    }

    pub async fn update_resource(
        &self,
        id: u64,
        request: UpdateResourceRequest,
    ) -> Result<Option<Resource>> {
        // Validation
        if let Some(ref name) = request.name {
            if name.trim().is_empty() {
                return Err(anyhow::anyhow!("Resource name cannot be empty"));
            }
            if name.len() > 100 {
                return Err(anyhow::anyhow!("Resource name cannot exceed 100 characters"));
            }
        }

        let updated_resource = self
            .repository
            .update(id, request)
            .await
            .context("Failed to update resource")?;

        // Update cache
        if let Some(ref resource) = updated_resource {
            let mut cache = self.cache.write().await;
            cache.insert(id, resource.clone());
            info!("Resource updated: {}", id);
        } else {
            warn!("Attempted to update non-existent resource: {}", id);
        }

        Ok(updated_resource)
    }

    pub async fn delete_resource(&self, id: u64) -> Result<bool> {
        let deleted = self
            .repository
            .delete(id)
            .await
            .context("Failed to delete resource")?;

        if deleted {
            // Remove from cache
            let mut cache = self.cache.write().await;
            cache.remove(&id);
            info!("Resource deleted: {}", id);
        } else {
            warn!("Attempted to delete non-existent resource: {}", id);
        }

        Ok(deleted)
    }

    pub async fn clear_cache(&self) {
        let mut cache = self.cache.write().await;
        cache.clear();
        info!("Resource cache cleared");
    }
}

// Error handling
#[derive(Debug, thiserror::Error)]
pub enum ResourceError {
    #[error("Resource not found")]
    NotFound,
    #[error("Invalid resource data: {0}")]
    InvalidData(String),
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

// Result type alias
pub type ResourceResult<T> = std::result::Result<T, ResourceError>;
```

## Configuration Templates

### Docker Compose Development Template
```yaml
# config/docker-compose.dev.yml
version: '3.8'

services:
  # Application service
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/app_db
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # PostgreSQL database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  # Redis cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Development tools
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: ae-startup-dev
```

## Automation Scripts

### Development Setup Script
```bash
#!/bin/bash
# scripts/setup-dev.sh

set -e

echo "🚀 Setting up ae-startup development environment..."

# Check prerequisites
command -v uv >/dev/null 2>&1 || { echo "❌ uv is required but not installed. Aborting." >&2; exit 1; }
command -v bun >/dev/null 2>&1 || { echo "❌ bun is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker is required but not installed. Aborting." >&2; exit 1; }

# Create directory structure
echo "📁 Creating project structure..."
mkdir -p {src,tests,docs,scripts,config}

# Python setup (if Python project)
if [ -f "pyproject.toml" ]; then
    echo "🐍 Setting up Python environment..."
    uv sync
    uv run pre-commit install
fi

# Node.js setup (if Node.js project)
if [ -f "package.json" ]; then
    echo "📦 Setting up Node.js environment..."
    bun install
fi

# Docker setup
echo "🐳 Starting development services..."
docker-compose -f config/docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run initial migrations or setup
if [ -f "scripts/migrate.sh" ]; then
    echo "🗄️ Running database migrations..."
    ./scripts/migrate.sh
fi

# Verify setup
echo "✅ Verifying setup..."
if [ -f "pyproject.toml" ]; then
    uv run python -c "print('Python environment ready')"
fi

if [ -f "package.json" ]; then
    bun run --silent -c "console.log('Node.js environment ready')"
fi

# Check Docker services
docker-compose -f config/docker-compose.dev.yml ps

echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  - Run 'uv run python main.py' (Python)"
echo "  - Run 'bun run dev' (Node.js)"
echo "  - Check 'README.md' for project-specific instructions"
```

## Communication Templates

### Status Update Email Template
```markdown
# communication/status-update-template.md

Subject: [Project Name] - Weekly Status Update (Week of [Date])

## 📊 Executive Summary
- **Overall Status**: [On Track / At Risk / Delayed]
- **Key Achievements**: [2-3 major accomplishments]
- **Upcoming Milestones**: [Next 1-2 key deliverables]

## ✅ Completed This Week
- [ ] [Specific accomplishment 1]
- [ ] [Specific accomplishment 2]
- [ ] [Specific accomplishment 3]

## 🎯 Planned for Next Week
- [ ] [Planned item 1]
- [ ] [Planned item 2]
- [ ] [Planned item 3]

## 🚧 Blockers & Risks
### Current Blockers
- **[Blocker 1]**: [Description and impact]
  - *Action*: [What's being done to resolve]
  - *ETA*: [Expected resolution date]

### Identified Risks
- **[Risk 1]**: [Description and potential impact]
  - *Mitigation*: [Prevention strategy]
  - *Contingency*: [Backup plan]

## 📈 Metrics & Progress
- **Feature Completion**: [X]% ([X] of [Y] features)
- **Test Coverage**: [X]%
- **Performance**: [Current vs. target metrics]
- **Quality Gates**: [X] of [Y] passed

## 🤝 Support Needed
- [Specific support request 1]
- [Specific support request 2]

## 📅 Upcoming Events
- [Date]: [Event/Milestone]
- [Date]: [Event/Milestone]

---
*Next Update: [Date]*
*Questions? Contact: [Your Contact Info]*
```

## Usage Guidelines

### Using Code Patterns
1. **Copy and adapt**: Don't just copy-paste; understand and modify for your specific needs
2. **Follow conventions**: Ensure patterns match your project's coding standards
3. **Update dependencies**: Verify all dependencies are current and compatible
4. **Test thoroughly**: Always test patterns in your specific environment
5. **Document changes**: Note any modifications made to patterns

### Managing Templates
- Keep templates current with latest best practices
- Version control all templates and track changes
- Test templates before committing to repository
- Share successful patterns with the team
- Archive obsolete templates with deprecation notes

### Quality Standards
All code patterns and templates must meet ae-co-system standards:
- **Performance**: Optimized for the target performance requirements
- **Security**: Include proper security measures and validation
- **Type Safety**: Use strong typing where applicable
- **Error Handling**: Comprehensive error handling and logging
- **Documentation**: Clear documentation and usage examples

This .cloud directory enables rapid development by providing proven, reusable components that maintain the elite-tier quality standards of the ae-co-system.