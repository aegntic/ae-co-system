"""Graphitti API - Advanced Knowledge Graph Versioning and Evolution Tracking Endpoints."""

import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import structlog
from fastapi import APIRouter, HTTPException, Query, Path, BackgroundTasks
from pydantic import BaseModel, Field

from graph.graphitti import Graphitti, SnapshotType, ChangeType

logger = structlog.get_logger()

# Pydantic Models for API
class CreateSnapshotRequest(BaseModel):
    snapshot_type: str = Field("incremental", description="Type of snapshot to create")
    name: Optional[str] = Field(None, description="Optional name for the snapshot")
    description: str = Field("", description="Description of the snapshot")
    tags: Optional[List[str]] = Field(None, description="Tags for categorization")
    include_concepts: bool = Field(True, description="Include concepts in snapshot")
    include_relationships: bool = Field(True, description="Include relationships in snapshot")
    concept_filter: Optional[Dict[str, Any]] = Field(None, description="Filter for concepts to include")

class CreateIterationRequest(BaseModel):
    version: str = Field(..., description="Version string for the iteration")
    name: str = Field(..., description="Human-readable name for the iteration")
    description: str = Field("", description="Description of the iteration")
    major_features: Optional[List[str]] = Field(None, description="List of major features in this iteration")
    tags: Optional[List[str]] = Field(None, description="Tags for categorization")
    create_snapshot: bool = Field(True, description="Whether to create a snapshot for this iteration")

class RestoreSnapshotRequest(BaseModel):
    snapshot_id: str = Field(..., description="ID of the snapshot to restore")
    dry_run: bool = Field(True, description="Whether to perform a dry run first")

class CompareIterationsRequest(BaseModel):
    from_version: str = Field(..., description="Starting version for comparison")
    to_version: str = Field(..., description="Ending version for comparison")
    detailed: bool = Field(False, description="Whether to include detailed change information")

class StartBatchRequest(BaseModel):
    name: str = Field(..., description="Name for the change batch")
    description: str = Field("", description="Description of the batch")
    source: str = Field("api", description="Source of the changes")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    user_id: Optional[str] = Field(None, description="ID of the user creating the batch")

class EvolutionTimelineRequest(BaseModel):
    start_date: Optional[datetime] = Field(None, description="Start date for timeline")
    end_date: Optional[datetime] = Field(None, description="End date for timeline")
    granularity: str = Field("day", description="Time granularity (hour, day, week, month)")
    include_details: bool = Field(False, description="Include detailed change information")

# Create API Router
router = APIRouter(prefix="/graphitti", tags=["Graphitti - Graph Versioning"])

# Global Graphitti instance (in production, use proper dependency injection)
graphitti_instance = None

def get_graphitti() -> Graphitti:
    """Get Graphitti instance (dependency injection placeholder)."""
    global graphitti_instance
    if not graphitti_instance:
        raise HTTPException(status_code=503, detail="Graphitti not initialized")
    return graphitti_instance

def set_graphitti(graphitti: Graphitti):
    """Set Graphitti instance (used during startup)."""
    global graphitti_instance
    graphitti_instance = graphitti

# Snapshot Management Endpoints
@router.post("/snapshots", summary="Create Knowledge Graph Snapshot")
async def create_snapshot(request: CreateSnapshotRequest, background_tasks: BackgroundTasks):
    """Create a snapshot of the current knowledge graph state."""
    logger.info("Creating knowledge graph snapshot", snapshot_type=request.snapshot_type)
    
    graphitti = get_graphitti()
    
    try:
        # Validate snapshot type
        try:
            snapshot_type = SnapshotType(request.snapshot_type)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid snapshot type. Valid types: {[t.value for t in SnapshotType]}"
            )
        
        # Create snapshot
        snapshot_id = await graphitti.create_snapshot(
            snapshot_type=snapshot_type,
            name=request.name,
            description=request.description,
            tags=request.tags,
            include_concepts=request.include_concepts,
            include_relationships=request.include_relationships,
            concept_filter=request.concept_filter
        )
        
        return {
            "snapshot_id": snapshot_id,
            "status": "created",
            "snapshot_type": request.snapshot_type,
            "created_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to create snapshot", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create snapshot: {str(e)}")

@router.get("/snapshots", summary="List Knowledge Graph Snapshots")
async def list_snapshots(
    snapshot_type: Optional[str] = Query(None, description="Filter by snapshot type"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of snapshots to return"),
    offset: int = Query(0, ge=0, description="Number of snapshots to skip")
):
    """List all knowledge graph snapshots with optional filtering."""
    graphitti = get_graphitti()
    
    try:
        async with graphitti.knowledge_db.pg_pool.acquire() as conn:
            # Build query with optional filtering
            where_clause = ""
            params = []
            param_count = 0
            
            if snapshot_type:
                param_count += 1
                where_clause = f"WHERE snapshot_type = ${param_count}"
                params.append(snapshot_type)
            
            query = f"""
            SELECT id, snapshot_type, timestamp, version, concepts_count, 
                   relationships_count, size_bytes, metadata, tags
            FROM graph_snapshots
            {where_clause}
            ORDER BY timestamp DESC
            LIMIT ${param_count + 1} OFFSET ${param_count + 2}
            """
            params.extend([limit, offset])
            
            snapshots = await conn.fetch(query, *params)
            
            # Get total count
            count_query = f"SELECT COUNT(*) FROM graph_snapshots {where_clause}"
            total_count = await conn.fetchval(count_query, *params[:-2])
        
        return {
            "snapshots": [
                {
                    "id": str(snapshot["id"]),
                    "snapshot_type": snapshot["snapshot_type"],
                    "timestamp": snapshot["timestamp"].isoformat(),
                    "version": snapshot["version"],
                    "concepts_count": snapshot["concepts_count"],
                    "relationships_count": snapshot["relationships_count"],
                    "size_mb": snapshot["size_bytes"] / 1024 / 1024,
                    "metadata": snapshot["metadata"],
                    "tags": snapshot["tags"]
                }
                for snapshot in snapshots
            ],
            "pagination": {
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            }
        }
        
    except Exception as e:
        logger.error("Failed to list snapshots", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list snapshots: {str(e)}")

@router.get("/snapshots/{snapshot_id}", summary="Get Snapshot Details")
async def get_snapshot(snapshot_id: str = Path(..., description="Snapshot ID")):
    """Get detailed information about a specific snapshot."""
    graphitti = get_graphitti()
    
    try:
        async with graphitti.knowledge_db.pg_pool.acquire() as conn:
            snapshot = await conn.fetchrow(
                "SELECT * FROM graph_snapshots WHERE id = $1",
                snapshot_id
            )
            
            if not snapshot:
                raise HTTPException(status_code=404, detail="Snapshot not found")
        
        return {
            "id": str(snapshot["id"]),
            "snapshot_type": snapshot["snapshot_type"],
            "timestamp": snapshot["timestamp"].isoformat(),
            "version": snapshot["version"],
            "concepts_count": snapshot["concepts_count"],
            "relationships_count": snapshot["relationships_count"],
            "checksum": snapshot["checksum"],
            "size_bytes": snapshot["size_bytes"],
            "size_mb": snapshot["size_bytes"] / 1024 / 1024,
            "metadata": snapshot["metadata"],
            "storage_path": snapshot["storage_path"],
            "parent_snapshot_id": str(snapshot["parent_snapshot_id"]) if snapshot["parent_snapshot_id"] else None,
            "tags": snapshot["tags"],
            "created_at": snapshot["created_at"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get snapshot", snapshot_id=snapshot_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get snapshot: {str(e)}")

@router.post("/snapshots/restore", summary="Restore Knowledge Graph from Snapshot")
async def restore_snapshot(request: RestoreSnapshotRequest):
    """Restore the knowledge graph to a previous snapshot state."""
    logger.info("Restoring snapshot", snapshot_id=request.snapshot_id, dry_run=request.dry_run)
    
    graphitti = get_graphitti()
    
    try:
        result = await graphitti.restore_snapshot(
            snapshot_id=request.snapshot_id,
            dry_run=request.dry_run
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to restore snapshot", snapshot_id=request.snapshot_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to restore snapshot: {str(e)}")

# Iteration Management Endpoints
@router.post("/iterations", summary="Create New Graph Iteration")
async def create_iteration(request: CreateIterationRequest):
    """Create a new major iteration of the knowledge graph."""
    logger.info("Creating graph iteration", version=request.version, name=request.name)
    
    graphitti = get_graphitti()
    
    try:
        # Check if version already exists
        async with graphitti.knowledge_db.pg_pool.acquire() as conn:
            existing = await conn.fetchval(
                "SELECT id FROM graph_iterations WHERE version = $1",
                request.version
            )
            
            if existing:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Iteration with version '{request.version}' already exists"
                )
        
        iteration_id = await graphitti.create_iteration(
            version=request.version,
            name=request.name,
            description=request.description,
            major_features=request.major_features,
            tags=request.tags,
            create_snapshot=request.create_snapshot
        )
        
        return {
            "iteration_id": iteration_id,
            "version": request.version,
            "name": request.name,
            "status": "created",
            "created_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create iteration", version=request.version, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create iteration: {str(e)}")

@router.get("/iterations", summary="List Graph Iterations")
async def list_iterations(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of iterations to return"),
    offset: int = Query(0, ge=0, description="Number of iterations to skip")
):
    """List all graph iterations."""
    graphitti = get_graphitti()
    
    try:
        async with graphitti.knowledge_db.pg_pool.acquire() as conn:
            iterations = await conn.fetch(
                """
                SELECT id, version, name, description, created_at, snapshot_id,
                       parent_iteration_id, changes_since_parent, major_features,
                       stability_rating, tags
                FROM graph_iterations
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
                """,
                limit, offset
            )
            
            total_count = await conn.fetchval("SELECT COUNT(*) FROM graph_iterations")
        
        return {
            "iterations": [
                {
                    "id": str(iteration["id"]),
                    "version": iteration["version"],
                    "name": iteration["name"],
                    "description": iteration["description"],
                    "created_at": iteration["created_at"].isoformat(),
                    "snapshot_id": str(iteration["snapshot_id"]) if iteration["snapshot_id"] else None,
                    "parent_iteration_id": str(iteration["parent_iteration_id"]) if iteration["parent_iteration_id"] else None,
                    "changes_since_parent": iteration["changes_since_parent"],
                    "major_features": iteration["major_features"],
                    "stability_rating": iteration["stability_rating"],
                    "tags": iteration["tags"]
                }
                for iteration in iterations
            ],
            "pagination": {
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            }
        }
        
    except Exception as e:
        logger.error("Failed to list iterations", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list iterations: {str(e)}")

@router.post("/iterations/compare", summary="Compare Two Graph Iterations")
async def compare_iterations(request: CompareIterationsRequest):
    """Compare two iterations of the knowledge graph."""
    logger.info("Comparing iterations", from_version=request.from_version, to_version=request.to_version)
    
    graphitti = get_graphitti()
    
    try:
        comparison = await graphitti.compare_iterations(
            from_version=request.from_version,
            to_version=request.to_version,
            detailed=request.detailed
        )
        
        return comparison
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to compare iterations", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to compare iterations: {str(e)}")

# Change Tracking Endpoints
@router.post("/batches", summary="Start Change Batch")
async def start_batch(request: StartBatchRequest):
    """Start a new change batch for grouping related changes."""
    logger.info("Starting change batch", name=request.name)
    
    graphitti = get_graphitti()
    
    try:
        batch_id = await graphitti.start_batch(
            name=request.name,
            description=request.description,
            source=request.source,
            metadata=request.metadata,
            user_id=request.user_id
        )
        
        return {
            "batch_id": batch_id,
            "name": request.name,
            "status": "active",
            "started_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to start batch", name=request.name, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to start batch: {str(e)}")

@router.post("/batches/{batch_id}/complete", summary="Complete Change Batch")
async def complete_batch(batch_id: str = Path(..., description="Batch ID")):
    """Complete the specified change batch."""
    logger.info("Completing change batch", batch_id=batch_id)
    
    graphitti = get_graphitti()
    
    try:
        summary = await graphitti.complete_batch(batch_id)
        return summary
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to complete batch", batch_id=batch_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to complete batch: {str(e)}")

@router.get("/batches", summary="List Change Batches")
async def list_batches(
    status: Optional[str] = Query(None, description="Filter by batch status"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of batches to return"),
    offset: int = Query(0, ge=0, description="Number of batches to skip")
):
    """List change batches with optional filtering."""
    graphitti = get_graphitti()
    
    try:
        async with graphitti.knowledge_db.pg_pool.acquire() as conn:
            where_clause = ""
            params = []
            param_count = 0
            
            if status:
                param_count += 1
                where_clause = f"WHERE status = ${param_count}"
                params.append(status)
            
            query = f"""
            SELECT id, name, description, started_at, completed_at, status,
                   changes_count, source, user_id
            FROM change_batches
            {where_clause}
            ORDER BY started_at DESC
            LIMIT ${param_count + 1} OFFSET ${param_count + 2}
            """
            params.extend([limit, offset])
            
            batches = await conn.fetch(query, *params)
            
            total_count = await conn.fetchval(
                f"SELECT COUNT(*) FROM change_batches {where_clause}",
                *params[:-2]
            )
        
        return {
            "batches": [
                {
                    "id": str(batch["id"]),
                    "name": batch["name"],
                    "description": batch["description"],
                    "started_at": batch["started_at"].isoformat(),
                    "completed_at": batch["completed_at"].isoformat() if batch["completed_at"] else None,
                    "status": batch["status"],
                    "changes_count": batch["changes_count"],
                    "source": batch["source"],
                    "user_id": batch["user_id"]
                }
                for batch in batches
            ],
            "pagination": {
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            }
        }
        
    except Exception as e:
        logger.error("Failed to list batches", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list batches: {str(e)}")

# Evolution Analytics Endpoints
@router.post("/evolution/timeline", summary="Get Evolution Timeline")
async def get_evolution_timeline(request: EvolutionTimelineRequest):
    """Get evolution timeline of the knowledge graph."""
    logger.info("Generating evolution timeline")
    
    graphitti = get_graphitti()
    
    try:
        timeline = await graphitti.get_evolution_timeline(
            start_date=request.start_date,
            end_date=request.end_date,
            granularity=request.granularity,
            include_details=request.include_details
        )
        
        return timeline
        
    except Exception as e:
        logger.error("Failed to generate evolution timeline", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate evolution timeline: {str(e)}")

@router.get("/health", summary="Get Graph Health Metrics")
async def get_graph_health():
    """Get comprehensive health metrics for the knowledge graph."""
    logger.info("Calculating graph health metrics")
    
    graphitti = get_graphitti()
    
    try:
        health_metrics = await graphitti.get_graph_health_metrics()
        return health_metrics
        
    except Exception as e:
        logger.error("Failed to calculate health metrics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to calculate health metrics: {str(e)}")

@router.get("/changes", summary="Get Recent Changes")
async def get_recent_changes(
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (concept/relationship)"),
    change_type: Optional[str] = Query(None, description="Filter by change type"),
    since: Optional[datetime] = Query(None, description="Show changes since this timestamp"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of changes to return"),
    offset: int = Query(0, ge=0, description="Number of changes to skip")
):
    """Get recent changes in the knowledge graph."""
    graphitti = get_graphitti()
    
    try:
        # Build dynamic query
        where_conditions = []
        params = []
        param_count = 0
        
        if entity_id:
            param_count += 1
            where_conditions.append(f"entity_id = ${param_count}")
            params.append(entity_id)
        
        if entity_type:
            param_count += 1
            where_conditions.append(f"entity_type = ${param_count}")
            params.append(entity_type)
        
        if change_type:
            param_count += 1
            where_conditions.append(f"change_type = ${param_count}")
            params.append(change_type)
        
        if since:
            param_count += 1
            where_conditions.append(f"timestamp >= ${param_count}")
            params.append(since)
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        query = f"""
        SELECT id, change_type, timestamp, entity_id, entity_type, 
               metadata, source, user_id, session_id, batch_id
        FROM graph_changes
        {where_clause}
        ORDER BY timestamp DESC
        LIMIT ${param_count + 1} OFFSET ${param_count + 2}
        """
        params.extend([limit, offset])
        
        async with graphitti.knowledge_db.pg_pool.acquire() as conn:
            changes = await conn.fetch(query, *params)
            
            # Get total count
            count_query = f"SELECT COUNT(*) FROM graph_changes {where_clause}"
            total_count = await conn.fetchval(count_query, *params[:-2])
        
        return {
            "changes": [
                {
                    "id": str(change["id"]),
                    "change_type": change["change_type"],
                    "timestamp": change["timestamp"].isoformat(),
                    "entity_id": change["entity_id"],
                    "entity_type": change["entity_type"],
                    "metadata": change["metadata"],
                    "source": change["source"],
                    "user_id": change["user_id"],
                    "session_id": change["session_id"],
                    "batch_id": str(change["batch_id"]) if change["batch_id"] else None
                }
                for change in changes
            ],
            "pagination": {
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            },
            "filters": {
                "entity_id": entity_id,
                "entity_type": entity_type,
                "change_type": change_type,
                "since": since.isoformat() if since else None
            }
        }
        
    except Exception as e:
        logger.error("Failed to get recent changes", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get recent changes: {str(e)}")

# Statistics and Analytics
@router.get("/stats", summary="Get Graphitti Statistics")
async def get_graphitti_stats():
    """Get comprehensive Graphitti system statistics."""
    graphitti = get_graphitti()
    
    try:
        async with graphitti.knowledge_db.pg_pool.acquire() as conn:
            # Get comprehensive stats
            stats = await conn.fetchrow(
                """
                SELECT 
                    (SELECT COUNT(*) FROM graph_changes) as total_changes,
                    (SELECT COUNT(*) FROM graph_snapshots) as total_snapshots,
                    (SELECT COUNT(*) FROM graph_iterations) as total_iterations,
                    (SELECT COUNT(*) FROM change_batches) as total_batches,
                    (SELECT COUNT(*) FROM graph_changes WHERE timestamp > NOW() - INTERVAL '24 hours') as changes_24h,
                    (SELECT COUNT(*) FROM graph_changes WHERE timestamp > NOW() - INTERVAL '7 days') as changes_7d,
                    (SELECT COUNT(*) FROM graph_changes WHERE timestamp > NOW() - INTERVAL '30 days') as changes_30d,
                    (SELECT COUNT(DISTINCT session_id) FROM graph_changes) as unique_sessions,
                    (SELECT AVG(size_bytes) FROM graph_snapshots) as avg_snapshot_size,
                    (SELECT SUM(size_bytes) FROM graph_snapshots) as total_storage_used
                """
            )
            
            # Get change type distribution
            change_types = await conn.fetch(
                """
                SELECT change_type, COUNT(*) as count
                FROM graph_changes
                GROUP BY change_type
                ORDER BY count DESC
                """
            )
            
            # Get recent activity by day
            daily_activity = await conn.fetch(
                """
                SELECT 
                    DATE_TRUNC('day', timestamp) as date,
                    COUNT(*) as changes
                FROM graph_changes
                WHERE timestamp > NOW() - INTERVAL '30 days'
                GROUP BY DATE_TRUNC('day', timestamp)
                ORDER BY date DESC
                """
            )
        
        return {
            "overview": {
                "total_changes": stats["total_changes"],
                "total_snapshots": stats["total_snapshots"],
                "total_iterations": stats["total_iterations"],
                "total_batches": stats["total_batches"],
                "unique_sessions": stats["unique_sessions"]
            },
            "recent_activity": {
                "changes_24h": stats["changes_24h"],
                "changes_7d": stats["changes_7d"],
                "changes_30d": stats["changes_30d"]
            },
            "storage": {
                "average_snapshot_size_mb": float(stats["avg_snapshot_size"] or 0) / 1024 / 1024,
                "total_storage_used_mb": float(stats["total_storage_used"] or 0) / 1024 / 1024
            },
            "change_type_distribution": [
                {
                    "change_type": row["change_type"],
                    "count": row["count"]
                }
                for row in change_types
            ],
            "daily_activity_30d": [
                {
                    "date": row["date"].date().isoformat(),
                    "changes": row["changes"]
                }
                for row in daily_activity
            ],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get Graphitti statistics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")
