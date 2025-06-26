"""Graphitti - Advanced Knowledge Graph Versioning and Evolution Tracking System."""

import asyncio
import uuid
import json
import hashlib
from typing import Dict, Any, List, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
import structlog

logger = structlog.get_logger()


class ChangeType(Enum):
    """Types of changes that can occur in the knowledge graph."""
    CONCEPT_CREATED = "concept_created"
    CONCEPT_UPDATED = "concept_updated"
    CONCEPT_DELETED = "concept_deleted"
    RELATIONSHIP_CREATED = "relationship_created"
    RELATIONSHIP_UPDATED = "relationship_updated"
    RELATIONSHIP_DELETED = "relationship_deleted"
    BATCH_UPDATE = "batch_update"
    SCHEMA_MIGRATION = "schema_migration"
    DATA_IMPORT = "data_import"
    AUTOMATED_ENHANCEMENT = "automated_enhancement"


class SnapshotType(Enum):
    """Types of snapshots for different use cases."""
    FULL_GRAPH = "full_graph"
    INCREMENTAL = "incremental"
    CONCEPT_SUBSET = "concept_subset"
    RELATIONSHIP_SUBSET = "relationship_subset"
    DAILY_BACKUP = "daily_backup"
    WEEKLY_BACKUP = "weekly_backup"
    MILESTONE = "milestone"
    PRE_MIGRATION = "pre_migration"


@dataclass
class GraphChange:
    """Represents a single change in the knowledge graph."""
    id: str
    change_type: ChangeType
    timestamp: datetime
    entity_id: str
    entity_type: str  # 'concept' or 'relationship'
    old_value: Optional[Dict[str, Any]]
    new_value: Optional[Dict[str, Any]]
    metadata: Dict[str, Any]
    source: str  # What triggered this change
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    batch_id: Optional[str] = None


@dataclass
class GraphSnapshot:
    """Represents a snapshot of the knowledge graph at a point in time."""
    id: str
    snapshot_type: SnapshotType
    timestamp: datetime
    version: str
    concepts_count: int
    relationships_count: int
    checksum: str
    size_bytes: int
    metadata: Dict[str, Any]
    storage_path: str
    parent_snapshot_id: Optional[str] = None
    tags: List[str] = None


@dataclass
class GraphIteration:
    """Represents a major iteration or version of the knowledge graph."""
    id: str
    version: str
    name: str
    description: str
    created_at: datetime
    snapshot_id: str
    parent_iteration_id: Optional[str]
    changes_since_parent: int
    major_features: List[str]
    performance_metrics: Dict[str, Any]
    quality_scores: Dict[str, float]
    stability_rating: float
    tags: List[str]


@dataclass
class EvolutionMetrics:
    """Metrics tracking the evolution of the knowledge graph."""
    concepts_added: int
    concepts_modified: int
    concepts_removed: int
    relationships_added: int
    relationships_modified: int
    relationships_removed: int
    average_concept_connections: float
    graph_density: float
    clustering_coefficient: float
    knowledge_diversity_index: float
    innovation_rate: float
    stability_score: float


class Graphitti:
    """Advanced Knowledge Graph Versioning and Evolution Tracking System."""
    
    def __init__(self, knowledge_db, storage_backend=None):
        self.knowledge_db = knowledge_db
        self.storage_backend = storage_backend or LocalStorageBackend()
        self.current_session_id = str(uuid.uuid4())
        self.active_batch_id = None
        
        logger.info("Graphitti versioning system initialized", session_id=self.current_session_id)
    
    async def initialize_schema(self):
        """Initialize the Graphitti database schema."""
        logger.info("Initializing Graphitti schema")
        
        schema_sql = """
        -- Graph changes tracking
        CREATE TABLE IF NOT EXISTS graph_changes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            change_type TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            entity_id TEXT NOT NULL,
            entity_type TEXT NOT NULL CHECK (entity_type IN ('concept', 'relationship')),
            old_value JSONB,
            new_value JSONB,
            metadata JSONB DEFAULT '{}',
            source TEXT NOT NULL,
            user_id TEXT,
            session_id TEXT NOT NULL,
            batch_id TEXT,
            checksum TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Graph snapshots
        CREATE TABLE IF NOT EXISTS graph_snapshots (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            snapshot_type TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            version TEXT NOT NULL,
            concepts_count INTEGER NOT NULL,
            relationships_count INTEGER NOT NULL,
            checksum TEXT NOT NULL,
            size_bytes BIGINT NOT NULL,
            metadata JSONB DEFAULT '{}',
            storage_path TEXT NOT NULL,
            parent_snapshot_id UUID REFERENCES graph_snapshots(id),
            tags TEXT[] DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Graph iterations (major versions)
        CREATE TABLE IF NOT EXISTS graph_iterations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            version TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            snapshot_id UUID NOT NULL REFERENCES graph_snapshots(id),
            parent_iteration_id UUID REFERENCES graph_iterations(id),
            changes_since_parent INTEGER DEFAULT 0,
            major_features TEXT[] DEFAULT '{}',
            performance_metrics JSONB DEFAULT '{}',
            quality_scores JSONB DEFAULT '{}',
            stability_rating FLOAT DEFAULT 0.5,
            tags TEXT[] DEFAULT '{}'
        );
        
        -- Evolution metrics tracking
        CREATE TABLE IF NOT EXISTS evolution_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            iteration_id UUID NOT NULL REFERENCES graph_iterations(id),
            snapshot_id UUID NOT NULL REFERENCES graph_snapshots(id),
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            concepts_added INTEGER DEFAULT 0,
            concepts_modified INTEGER DEFAULT 0,
            concepts_removed INTEGER DEFAULT 0,
            relationships_added INTEGER DEFAULT 0,
            relationships_modified INTEGER DEFAULT 0,
            relationships_removed INTEGER DEFAULT 0,
            average_concept_connections FLOAT DEFAULT 0.0,
            graph_density FLOAT DEFAULT 0.0,
            clustering_coefficient FLOAT DEFAULT 0.0,
            knowledge_diversity_index FLOAT DEFAULT 0.0,
            innovation_rate FLOAT DEFAULT 0.0,
            stability_score FLOAT DEFAULT 0.0,
            metadata JSONB DEFAULT '{}'
        );
        
        -- Change batch tracking
        CREATE TABLE IF NOT EXISTS change_batches (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT,
            description TEXT,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
            changes_count INTEGER DEFAULT 0,
            source TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            user_id TEXT,
            session_id TEXT NOT NULL
        );
        
        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_graph_changes_timestamp ON graph_changes(timestamp);
        CREATE INDEX IF NOT EXISTS idx_graph_changes_entity ON graph_changes(entity_id, entity_type);
        CREATE INDEX IF NOT EXISTS idx_graph_changes_session ON graph_changes(session_id);
        CREATE INDEX IF NOT EXISTS idx_graph_changes_batch ON graph_changes(batch_id);
        CREATE INDEX IF NOT EXISTS idx_graph_changes_type ON graph_changes(change_type);
        
        CREATE INDEX IF NOT EXISTS idx_graph_snapshots_timestamp ON graph_snapshots(timestamp);
        CREATE INDEX IF NOT EXISTS idx_graph_snapshots_version ON graph_snapshots(version);
        CREATE INDEX IF NOT EXISTS idx_graph_snapshots_type ON graph_snapshots(snapshot_type);
        
        CREATE INDEX IF NOT EXISTS idx_graph_iterations_version ON graph_iterations(version);
        CREATE INDEX IF NOT EXISTS idx_graph_iterations_created ON graph_iterations(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_evolution_metrics_iteration ON evolution_metrics(iteration_id);
        CREATE INDEX IF NOT EXISTS idx_evolution_metrics_timestamp ON evolution_metrics(timestamp);
        
        -- Materialized view for quick evolution analytics
        CREATE MATERIALIZED VIEW IF NOT EXISTS evolution_summary AS
        SELECT 
            DATE_TRUNC('day', timestamp) as date,
            COUNT(*) as total_changes,
            COUNT(CASE WHEN change_type LIKE '%_created' THEN 1 END) as creations,
            COUNT(CASE WHEN change_type LIKE '%_updated' THEN 1 END) as updates,
            COUNT(CASE WHEN change_type LIKE '%_deleted' THEN 1 END) as deletions,
            COUNT(DISTINCT session_id) as unique_sessions,
            COUNT(DISTINCT batch_id) as unique_batches
        FROM graph_changes 
        GROUP BY DATE_TRUNC('day', timestamp)
        ORDER BY date DESC;
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_evolution_summary_date ON evolution_summary(date);
        """
        
        async with self.knowledge_db.pg_pool.acquire() as conn:
            await conn.execute(schema_sql)
            logger.info("Graphitti schema created successfully")
    
    # Change Tracking Methods
    async def track_change(
        self,
        change_type: ChangeType,
        entity_id: str,
        entity_type: str,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        source: str = "api",
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> str:
        """Track a single change in the knowledge graph."""
        
        change = GraphChange(
            id=str(uuid.uuid4()),
            change_type=change_type,
            timestamp=datetime.utcnow(),
            entity_id=entity_id,
            entity_type=entity_type,
            old_value=old_value,
            new_value=new_value,
            metadata=metadata or {},
            source=source,
            user_id=user_id,
            session_id=self.current_session_id,
            batch_id=self.active_batch_id
        )
        
        # Calculate checksum for integrity verification
        checksum = self._calculate_change_checksum(change)
        
        async with self.knowledge_db.pg_pool.acquire() as conn:
            change_id = await conn.fetchval(
                """
                INSERT INTO graph_changes 
                (id, change_type, entity_id, entity_type, old_value, new_value, 
                 metadata, source, user_id, session_id, batch_id, checksum)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
                """,
                change.id, change_type.value, entity_id, entity_type,
                json.dumps(old_value) if old_value else None,
                json.dumps(new_value) if new_value else None,
                json.dumps(change.metadata), source, user_id,
                self.current_session_id, self.active_batch_id, checksum
            )
            
            # Update batch counter if in a batch
            if self.active_batch_id:
                await conn.execute(
                    "UPDATE change_batches SET changes_count = changes_count + 1 WHERE id = $1",
                    self.active_batch_id
                )
        
        logger.debug("Change tracked", change_id=change_id, change_type=change_type.value, entity_id=entity_id)
        return str(change_id)
    
    async def start_batch(
        self,
        name: str,
        description: str = "",
        source: str = "api",
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> str:
        """Start a new change batch for grouping related changes."""
        
        batch_id = str(uuid.uuid4())
        
        async with self.knowledge_db.pg_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO change_batches (id, name, description, source, metadata, user_id, session_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                batch_id, name, description, source,
                json.dumps(metadata or {}), user_id, self.current_session_id
            )
        
        self.active_batch_id = batch_id
        logger.info("Change batch started", batch_id=batch_id, name=name)
        return batch_id
    
    async def complete_batch(self, batch_id: Optional[str] = None) -> Dict[str, Any]:
        """Complete the current or specified change batch."""
        
        target_batch_id = batch_id or self.active_batch_id
        if not target_batch_id:
            raise ValueError("No active batch to complete")
        
        async with self.knowledge_db.pg_pool.acquire() as conn:
            # Update batch status
            result = await conn.fetchrow(
                """
                UPDATE change_batches 
                SET completed_at = NOW(), status = 'completed'
                WHERE id = $1
                RETURNING name, changes_count, started_at
                """,
                target_batch_id
            )
            
            if not result:
                raise ValueError(f"Batch {target_batch_id} not found")
            
            # Get batch summary
            changes = await conn.fetch(
                "SELECT change_type, COUNT(*) as count FROM graph_changes WHERE batch_id = $1 GROUP BY change_type",
                target_batch_id
            )
        
        if target_batch_id == self.active_batch_id:
            self.active_batch_id = None
        
        batch_summary = {
            "batch_id": target_batch_id,
            "name": result["name"],
            "total_changes": result["changes_count"],
            "duration_seconds": (datetime.utcnow() - result["started_at"]).total_seconds(),
            "changes_by_type": {row["change_type"]: row["count"] for row in changes}
        }
        
        logger.info("Change batch completed", **batch_summary)
        return batch_summary
    
    # Snapshot Management
    async def create_snapshot(
        self,
        snapshot_type: SnapshotType = SnapshotType.INCREMENTAL,
        name: Optional[str] = None,
        description: str = "",
        tags: Optional[List[str]] = None,
        include_concepts: bool = True,
        include_relationships: bool = True,
        concept_filter: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a snapshot of the current knowledge graph state."""
        
        logger.info("Creating knowledge graph snapshot", snapshot_type=snapshot_type.value)
        
        # Generate version string
        version = await self._generate_version_string(snapshot_type)
        
        # Extract graph data
        graph_data = await self._extract_graph_data(
            include_concepts, include_relationships, concept_filter
        )
        
        # Calculate metrics
        concepts_count = len(graph_data.get("concepts", []))
        relationships_count = len(graph_data.get("relationships", []))
        checksum = self._calculate_graph_checksum(graph_data)
        
        # Store snapshot data
        storage_path = await self.storage_backend.store_snapshot(
            version, graph_data, snapshot_type
        )
        
        size_bytes = await self.storage_backend.get_snapshot_size(storage_path)
        
        # Find parent snapshot for incremental snapshots
        parent_snapshot_id = None
        if snapshot_type == SnapshotType.INCREMENTAL:
            parent_snapshot_id = await self._get_latest_snapshot_id()
        
        # Create snapshot record
        snapshot_id = str(uuid.uuid4())
        metadata = {
            "name": name,
            "description": description,
            "include_concepts": include_concepts,
            "include_relationships": include_relationships,
            "concept_filter": concept_filter,
            "session_id": self.current_session_id
        }
        
        async with self.knowledge_db.pg_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO graph_snapshots 
                (id, snapshot_type, version, concepts_count, relationships_count, 
                 checksum, size_bytes, metadata, storage_path, parent_snapshot_id, tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                """,
                snapshot_id, snapshot_type.value, version, concepts_count, relationships_count,
                checksum, size_bytes, json.dumps(metadata), storage_path,
                parent_snapshot_id, tags or []
            )
        
        logger.info(
            "Snapshot created successfully",
            snapshot_id=snapshot_id,
            version=version,
            concepts_count=concepts_count,
            relationships_count=relationships_count,
            size_mb=size_bytes / 1024 / 1024
        )
        
        return snapshot_id
    
    async def restore_snapshot(self, snapshot_id: str, dry_run: bool = False) -> Dict[str, Any]:
        """Restore the knowledge graph to a previous snapshot state."""
        
        logger.info("Restoring knowledge graph snapshot", snapshot_id=snapshot_id, dry_run=dry_run)
        
        # Get snapshot metadata
        async with self.knowledge_db.pg_pool.acquire() as conn:
            snapshot = await conn.fetchrow(
                "SELECT * FROM graph_snapshots WHERE id = $1",
                snapshot_id
            )
            
            if not snapshot:
                raise ValueError(f"Snapshot {snapshot_id} not found")
        
        # Load snapshot data
        graph_data = await self.storage_backend.load_snapshot(snapshot["storage_path"])
        
        if dry_run:
            # Return what would be changed without actually doing it
            current_state = await self._extract_graph_data(True, True)
            diff = await self._compare_graph_states(current_state, graph_data)
            return {
                "snapshot_id": snapshot_id,
                "snapshot_version": snapshot["version"],
                "dry_run": True,
                "changes_required": diff,
                "concepts_to_add": len(diff.get("concepts_to_add", [])),
                "concepts_to_update": len(diff.get("concepts_to_update", [])),
                "concepts_to_remove": len(diff.get("concepts_to_remove", [])),
                "relationships_to_add": len(diff.get("relationships_to_add", [])),
                "relationships_to_update": len(diff.get("relationships_to_update", [])),
                "relationships_to_remove": len(diff.get("relationships_to_remove", []))
            }
        
        # Start restoration batch
        batch_id = await self.start_batch(
            f"Restore to snapshot {snapshot['version']}",
            f"Restoring knowledge graph to snapshot {snapshot_id}",
            source="graphitti_restore"
        )
        
        try:
            # Apply restoration
            restoration_stats = await self._apply_graph_data(graph_data, track_changes=True)
            
            # Complete batch
            batch_summary = await self.complete_batch(batch_id)
            
            logger.info(
                "Snapshot restoration completed",
                snapshot_id=snapshot_id,
                **restoration_stats
            )
            
            return {
                "snapshot_id": snapshot_id,
                "snapshot_version": snapshot["version"],
                "dry_run": False,
                "restoration_stats": restoration_stats,
                "batch_summary": batch_summary
            }
            
        except Exception as e:
            # Cancel batch on error
            await self._cancel_batch(batch_id)
            logger.error("Snapshot restoration failed", snapshot_id=snapshot_id, error=str(e))
            raise
    
    # Iteration Management
    async def create_iteration(
        self,
        version: str,
        name: str,
        description: str = "",
        major_features: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        create_snapshot: bool = True
    ) -> str:
        """Create a new major iteration of the knowledge graph."""
        
        logger.info("Creating new graph iteration", version=version, name=name)
        
        # Create snapshot if requested
        snapshot_id = None
        if create_snapshot:
            snapshot_id = await self.create_snapshot(
                SnapshotType.MILESTONE,
                name=f"Iteration {version} - {name}",
                description=description,
                tags=tags
            )
        
        # Get parent iteration
        parent_iteration_id = await self._get_latest_iteration_id()
        
        # Calculate changes since parent
        changes_since_parent = 0
        if parent_iteration_id:
            changes_since_parent = await self._count_changes_since_iteration(parent_iteration_id)
        
        # Calculate performance metrics and quality scores
        performance_metrics = await self._calculate_performance_metrics()
        quality_scores = await self._calculate_quality_scores()
        stability_rating = await self._calculate_stability_rating()
        
        # Create iteration record
        iteration_id = str(uuid.uuid4())
        
        async with self.knowledge_db.pg_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO graph_iterations 
                (id, version, name, description, snapshot_id, parent_iteration_id, 
                 changes_since_parent, major_features, performance_metrics, 
                 quality_scores, stability_rating, tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                """,
                iteration_id, version, name, description, snapshot_id, parent_iteration_id,
                changes_since_parent, major_features or [], json.dumps(performance_metrics),
                json.dumps(quality_scores), stability_rating, tags or []
            )
        
        # Calculate and store evolution metrics
        evolution_metrics = await self._calculate_evolution_metrics(iteration_id, snapshot_id)
        await self._store_evolution_metrics(iteration_id, snapshot_id, evolution_metrics)
        
        logger.info(
            "Graph iteration created",
            iteration_id=iteration_id,
            version=version,
            changes_since_parent=changes_since_parent,
            stability_rating=stability_rating
        )
        
        return iteration_id
    
    async def compare_iterations(
        self,
        from_version: str,
        to_version: str,
        detailed: bool = False
    ) -> Dict[str, Any]:
        """Compare two iterations of the knowledge graph."""
        
        logger.info("Comparing graph iterations", from_version=from_version, to_version=to_version)
        
        # Get iteration data
        async with self.knowledge_db.pg_pool.acquire() as conn:
            from_iteration = await conn.fetchrow(
                "SELECT * FROM graph_iterations WHERE version = $1",
                from_version
            )
            to_iteration = await conn.fetchrow(
                "SELECT * FROM graph_iterations WHERE version = $1",
                to_version
            )
            
            if not from_iteration or not to_iteration:
                raise ValueError(f"One or both iterations not found")
        
        # Get changes between iterations
        changes = await self._get_changes_between_iterations(
            from_iteration["created_at"],
            to_iteration["created_at"]
        )
        
        # Calculate comparison metrics
        comparison = {
            "from_iteration": {
                "version": from_iteration["version"],
                "name": from_iteration["name"],
                "created_at": from_iteration["created_at"].isoformat(),
                "stability_rating": from_iteration["stability_rating"]
            },
            "to_iteration": {
                "version": to_iteration["version"],
                "name": to_iteration["name"],
                "created_at": to_iteration["created_at"].isoformat(),
                "stability_rating": to_iteration["stability_rating"]
            },
            "summary": {
                "total_changes": len(changes),
                "concepts_created": len([c for c in changes if c["change_type"] == "concept_created"]),
                "concepts_updated": len([c for c in changes if c["change_type"] == "concept_updated"]),
                "concepts_deleted": len([c for c in changes if c["change_type"] == "concept_deleted"]),
                "relationships_created": len([c for c in changes if c["change_type"] == "relationship_created"]),
                "relationships_updated": len([c for c in changes if c["change_type"] == "relationship_updated"]),
                "relationships_deleted": len([c for c in changes if c["change_type"] == "relationship_deleted"]),
                "stability_improvement": to_iteration["stability_rating"] - from_iteration["stability_rating"]
            }
        }
        
        if detailed:
            # Add detailed change breakdown
            comparison["detailed_changes"] = [
                {
                    "id": str(change["id"]),
                    "change_type": change["change_type"],
                    "entity_id": change["entity_id"],
                    "entity_type": change["entity_type"],
                    "timestamp": change["timestamp"].isoformat(),
                    "source": change["source"]
                }
                for change in changes
            ]
            
            # Add snapshot comparisons if available
            if from_iteration["snapshot_id"] and to_iteration["snapshot_id"]:
                snapshot_comparison = await self._compare_snapshots(
                    from_iteration["snapshot_id"],
                    to_iteration["snapshot_id"]
                )
                comparison["snapshot_comparison"] = snapshot_comparison
        
        return comparison
    
    # Evolution Analytics
    async def get_evolution_timeline(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        granularity: str = "day",  # hour, day, week, month
        include_details: bool = False
    ) -> Dict[str, Any]:
        """Get evolution timeline of the knowledge graph."""
        
        start_date = start_date or (datetime.utcnow() - timedelta(days=30))
        end_date = end_date or datetime.utcnow()
        
        logger.info(
            "Generating evolution timeline",
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            granularity=granularity
        )
        
        async with self.knowledge_db.pg_pool.acquire() as conn:
            # Refresh materialized view
            await conn.execute("REFRESH MATERIALIZED VIEW evolution_summary")
            
            # Get timeline data
            timeline = await conn.fetch(
                """
                SELECT 
                    date,
                    total_changes,
                    creations,
                    updates,
                    deletions,
                    unique_sessions,
                    unique_batches
                FROM evolution_summary
                WHERE date BETWEEN $1 AND $2
                ORDER BY date
                """,
                start_date.date(), end_date.date()
            )
            
            # Get iteration milestones in the timeframe
            iterations = await conn.fetch(
                """
                SELECT version, name, created_at, stability_rating
                FROM graph_iterations
                WHERE created_at BETWEEN $1 AND $2
                ORDER BY created_at
                """,
                start_date, end_date
            )
        
        timeline_data = {
            "timeframe": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "granularity": granularity
            },
            "daily_evolution": [
                {
                    "date": row["date"].isoformat(),
                    "total_changes": row["total_changes"],
                    "creations": row["creations"],
                    "updates": row["updates"],
                    "deletions": row["deletions"],
                    "unique_sessions": row["unique_sessions"],
                    "unique_batches": row["unique_batches"]
                }
                for row in timeline
            ],
            "iteration_milestones": [
                {
                    "version": iteration["version"],
                    "name": iteration["name"],
                    "created_at": iteration["created_at"].isoformat(),
                    "stability_rating": iteration["stability_rating"]
                }
                for iteration in iterations
            ],
            "summary_statistics": {
                "total_days": len(timeline),
                "total_changes": sum(row["total_changes"] for row in timeline),
                "average_daily_changes": sum(row["total_changes"] for row in timeline) / len(timeline) if timeline else 0,
                "most_active_day": max(timeline, key=lambda x: x["total_changes"])["date"].isoformat() if timeline else None,
                "iterations_created": len(iterations)
            }
        }
        
        if include_details:
            # Add detailed change breakdown
            detailed_changes = await self._get_detailed_changes_in_timeframe(start_date, end_date)
            timeline_data["detailed_changes"] = detailed_changes
        
        return timeline_data
    
    async def get_graph_health_metrics(self) -> Dict[str, Any]:
        """Get comprehensive health metrics for the knowledge graph."""
        
        logger.info("Calculating graph health metrics")
        
        async with self.knowledge_db.pg_pool.acquire() as conn:
            # Basic statistics
            stats = await conn.fetchrow(
                """
                SELECT 
                    (SELECT COUNT(*) FROM knowledge_nodes) as total_concepts,
                    (SELECT COUNT(*) FROM knowledge_relationships) as total_relationships,
                    (SELECT COUNT(*) FROM graph_changes WHERE timestamp > NOW() - INTERVAL '24 hours') as changes_24h,
                    (SELECT COUNT(*) FROM graph_changes WHERE timestamp > NOW() - INTERVAL '7 days') as changes_7d,
                    (SELECT COUNT(DISTINCT session_id) FROM graph_changes WHERE timestamp > NOW() - INTERVAL '24 hours') as active_sessions_24h,
                    (SELECT COUNT(*) FROM graph_snapshots) as total_snapshots,
                    (SELECT COUNT(*) FROM graph_iterations) as total_iterations
                """
            )
            
            # Quality metrics
            quality_metrics = await conn.fetchrow(
                """
                SELECT 
                    AVG(relevance_score) as avg_relevance,
                    AVG(occurrence_count) as avg_occurrence,
                    COUNT(CASE WHEN relevance_score > 0.8 THEN 1 END) * 100.0 / COUNT(*) as high_quality_percentage
                FROM knowledge_nodes
                """
            )
            
            # Recent error analysis
            recent_errors = await conn.fetchval(
                """
                SELECT COUNT(*) 
                FROM graph_changes 
                WHERE timestamp > NOW() - INTERVAL '24 hours'
                AND metadata->>'error' IS NOT NULL
                """
            )
            
            # Latest iteration stability
            latest_stability = await conn.fetchval(
                """
                SELECT stability_rating 
                FROM graph_iterations 
                ORDER BY created_at DESC 
                LIMIT 1
                """
            )
        
        # Calculate graph density (relationships per concept)
        graph_density = stats["total_relationships"] / stats["total_concepts"] if stats["total_concepts"] > 0 else 0
        
        # Calculate activity score (changes per day over last week)
        activity_score = stats["changes_7d"] / 7 if stats["changes_7d"] and stats["changes_7d"] > 0 else 0
        
        # Calculate overall health score
        health_factors = {
            "stability": latest_stability or 0.5,
            "quality": quality_metrics["high_quality_percentage"] / 100 if quality_metrics["high_quality_percentage"] else 0.5,
            "activity": min(1.0, activity_score / 10),  # Normalize to 10 changes per day = 1.0
            "error_rate": max(0.0, 1.0 - (recent_errors / max(1, stats["changes_24h"] or 1))),
            "density": min(1.0, graph_density / 5)  # Normalize to 5 relationships per concept = 1.0
        }
        
        overall_health = sum(health_factors.values()) / len(health_factors)
        
        return {
            "overall_health_score": overall_health,
            "health_grade": self._calculate_health_grade(overall_health),
            "statistics": {
                "total_concepts": stats["total_concepts"],
                "total_relationships": stats["total_relationships"],
                "graph_density": graph_density,
                "changes_24h": stats["changes_24h"],
                "changes_7d": stats["changes_7d"],
                "active_sessions_24h": stats["active_sessions_24h"],
                "total_snapshots": stats["total_snapshots"],
                "total_iterations": stats["total_iterations"]
            },
            "quality_metrics": {
                "average_relevance": float(quality_metrics["avg_relevance"]) if quality_metrics["avg_relevance"] else 0.0,
                "average_occurrence": float(quality_metrics["avg_occurrence"]) if quality_metrics["avg_occurrence"] else 0.0,
                "high_quality_percentage": float(quality_metrics["high_quality_percentage"]) if quality_metrics["high_quality_percentage"] else 0.0
            },
            "health_factors": health_factors,
            "recent_errors": recent_errors,
            "latest_stability_rating": latest_stability,
            "recommendations": self._generate_health_recommendations(health_factors, stats)
        }
    
    # Helper Methods
    def _calculate_change_checksum(self, change: GraphChange) -> str:
        """Calculate checksum for change integrity verification."""
        change_str = f"{change.entity_id}:{change.entity_type}:{change.change_type.value}:{json.dumps(change.new_value, sort_keys=True)}"
        return hashlib.sha256(change_str.encode()).hexdigest()[:16]
    
    def _calculate_graph_checksum(self, graph_data: Dict[str, Any]) -> str:
        """Calculate checksum for entire graph data."""
        graph_str = json.dumps(graph_data, sort_keys=True)
        return hashlib.sha256(graph_str.encode()).hexdigest()
    
    async def _generate_version_string(self, snapshot_type: SnapshotType) -> str:
        """Generate version string for snapshots."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        if snapshot_type == SnapshotType.DAILY_BACKUP:
            return f"daily_{timestamp}"
        elif snapshot_type == SnapshotType.WEEKLY_BACKUP:
            return f"weekly_{timestamp}"
        elif snapshot_type == SnapshotType.MILESTONE:
            return f"milestone_{timestamp}"
        else:
            return f"snapshot_{timestamp}"
    
    async def _extract_graph_data(
        self,
        include_concepts: bool = True,
        include_relationships: bool = True,
        concept_filter: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Extract current graph data for snapshots."""
        
        graph_data = {"timestamp": datetime.utcnow().isoformat()}
        
        async with self.knowledge_db.pg_pool.acquire() as conn:
            if include_concepts:
                if concept_filter:
                    # Apply filters (simplified example)
                    concepts = await conn.fetch(
                        "SELECT * FROM knowledge_nodes WHERE concept_type = ANY($1)",
                        concept_filter.get("types", [])
                    )
                else:
                    concepts = await conn.fetch("SELECT * FROM knowledge_nodes")
                
                graph_data["concepts"] = [
                    {
                        "id": str(concept["id"]),
                        "concept_name": concept["concept_name"],
                        "concept_type": concept["concept_type"],
                        "properties": json.loads(concept["properties"]) if concept["properties"] else {},
                        "relevance_score": concept["relevance_score"],
                        "occurrence_count": concept["occurrence_count"],
                        "first_seen": concept["first_seen"].isoformat(),
                        "last_updated": concept["last_updated"].isoformat()
                    }
                    for concept in concepts
                ]
            
            if include_relationships:
                relationships = await conn.fetch("SELECT * FROM knowledge_relationships")
                graph_data["relationships"] = [
                    {
                        "id": str(rel["id"]),
                        "from_node": str(rel["from_node"]),
                        "to_node": str(rel["to_node"]),
                        "relationship_type": rel["relationship_type"],
                        "strength": rel["strength"],
                        "context": json.loads(rel["context"]) if rel["context"] else {},
                        "created_at": rel["created_at"].isoformat(),
                        "updated_at": rel["updated_at"].isoformat()
                    }
                    for rel in relationships
                ]
        
        return graph_data
    
    def _calculate_health_grade(self, health_score: float) -> str:
        """Calculate letter grade for graph health."""
        if health_score >= 0.9:
            return "A+"
        elif health_score >= 0.8:
            return "A"
        elif health_score >= 0.7:
            return "B"
        elif health_score >= 0.6:
            return "C"
        elif health_score >= 0.5:
            return "D"
        else:
            return "F"
    
    def _generate_health_recommendations(self, health_factors: Dict[str, float], stats: Dict) -> List[str]:
        """Generate recommendations based on health metrics."""
        recommendations = []
        
        if health_factors["stability"] < 0.7:
            recommendations.append("Consider creating more snapshots to improve stability")
        
        if health_factors["quality"] < 0.6:
            recommendations.append("Review and improve concept relevance scores")
        
        if health_factors["activity"] < 0.3:
            recommendations.append("Graph activity is low - consider analyzing more content")
        
        if health_factors["error_rate"] < 0.8:
            recommendations.append("High error rate detected - review recent changes")
        
        if health_factors["density"] < 0.3:
            recommendations.append("Graph density is low - consider adding more relationships")
        
        if stats["total_snapshots"] < 5:
            recommendations.append("Create regular snapshots for better versioning")
        
        return recommendations
    
    # Additional helper methods would be implemented here...
    # (keeping the response length manageable)


class LocalStorageBackend:
    """Local file system storage backend for snapshots."""
    
    def __init__(self, base_path: str = "./snapshots"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)
    
    async def store_snapshot(self, version: str, graph_data: Dict[str, Any], snapshot_type: SnapshotType) -> str:
        """Store snapshot data to local filesystem."""
        filename = f"{snapshot_type.value}_{version}.json"
        file_path = self.base_path / filename
        
        with open(file_path, 'w') as f:
            json.dump(graph_data, f, indent=2)
        
        return str(file_path)
    
    async def load_snapshot(self, storage_path: str) -> Dict[str, Any]:
        """Load snapshot data from local filesystem."""
        with open(storage_path, 'r') as f:
            return json.load(f)
    
    async def get_snapshot_size(self, storage_path: str) -> int:
        """Get size of snapshot file in bytes."""
        return Path(storage_path).stat().st_size
