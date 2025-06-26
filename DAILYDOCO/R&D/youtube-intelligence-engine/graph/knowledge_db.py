"""Knowledge Graph Database - Manages intelligent storage and retrieval of concepts and relationships."""

import asyncio
import uuid
from typing import Dict, Any, List, Optional, Tuple
import json
from datetime import datetime
import structlog

try:
    import asyncpg
except ImportError:
    asyncpg = None

try:
    from neo4j import AsyncGraphDatabase
except ImportError:
    AsyncGraphDatabase = None

logger = structlog.get_logger()


class KnowledgeDB:
    """Hybrid knowledge database using PostgreSQL + Neo4j for optimal performance."""
    
    def __init__(
        self,
        postgres_url: str,
        neo4j_url: Optional[str] = None,
        neo4j_auth: Optional[Tuple[str, str]] = None
    ):
        self.postgres_url = postgres_url
        self.neo4j_url = neo4j_url
        self.neo4j_auth = neo4j_auth
        
        self.pg_pool = None
        self.neo4j_driver = None
        
        logger.info("KnowledgeDB initialized", postgres=bool(postgres_url), neo4j=bool(neo4j_url))
    
    async def initialize(self):
        """Initialize database connections and create schema."""
        logger.info("Initializing knowledge database connections")
        
        # Initialize PostgreSQL connection pool
        if asyncpg:
            try:
                self.pg_pool = await asyncpg.create_pool(self.postgres_url)
                await self._create_postgres_schema()
                logger.info("PostgreSQL connection established")
            except Exception as e:
                logger.error("PostgreSQL initialization failed", error=str(e))
                raise
        
        # Initialize Neo4j connection (optional)
        if self.neo4j_url and AsyncGraphDatabase:
            try:
                self.neo4j_driver = AsyncGraphDatabase.driver(
                    self.neo4j_url, 
                    auth=self.neo4j_auth
                )
                await self._create_neo4j_schema()
                logger.info("Neo4j connection established")
            except Exception as e:
                logger.warning("Neo4j initialization failed, using PostgreSQL only", error=str(e))
    
    async def _create_postgres_schema(self):
        """Create PostgreSQL schema for knowledge storage."""
        schema_sql = """
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Core content analysis table
        CREATE TABLE IF NOT EXISTS youtube_content (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            url TEXT UNIQUE NOT NULL,
            title TEXT,
            description TEXT,
            transcript TEXT,
            metadata JSONB,
            analysis_results JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Generated actions and suggestions
        CREATE TABLE IF NOT EXISTS intelligent_actions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            content_id UUID REFERENCES youtube_content(id) ON DELETE CASCADE,
            action_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            implementation_plan JSONB,
            feasibility_score FLOAT CHECK (feasibility_score >= 0 AND feasibility_score <= 1),
            impact_score FLOAT CHECK (impact_score >= 0 AND impact_score <= 1),
            context_rating JSONB,
            tags TEXT[],
            status TEXT DEFAULT 'identified',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Knowledge graph nodes (concepts)
        CREATE TABLE IF NOT EXISTS knowledge_nodes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            concept_name TEXT NOT NULL,
            concept_type TEXT NOT NULL,
            properties JSONB,
            relevance_score FLOAT CHECK (relevance_score >= 0 AND relevance_score <= 1),
            source_actions UUID[],
            first_seen TIMESTAMP DEFAULT NOW(),
            last_updated TIMESTAMP DEFAULT NOW(),
            occurrence_count INTEGER DEFAULT 1,
            UNIQUE(concept_name, concept_type)
        );
        
        -- Knowledge graph relationships
        CREATE TABLE IF NOT EXISTS knowledge_relationships (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            from_node UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
            to_node UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
            relationship_type TEXT NOT NULL,
            strength FLOAT CHECK (strength >= 0 AND strength <= 1),
            context JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(from_node, to_node, relationship_type)
        );
        
        -- Search and analytics views
        CREATE INDEX IF NOT EXISTS idx_youtube_content_url ON youtube_content(url);
        CREATE INDEX IF NOT EXISTS idx_youtube_content_created ON youtube_content(created_at);
        CREATE INDEX IF NOT EXISTS idx_intelligent_actions_content ON intelligent_actions(content_id);
        CREATE INDEX IF NOT EXISTS idx_intelligent_actions_type ON intelligent_actions(action_type);
        CREATE INDEX IF NOT EXISTS idx_intelligent_actions_feasibility ON intelligent_actions(feasibility_score);
        CREATE INDEX IF NOT EXISTS idx_intelligent_actions_impact ON intelligent_actions(impact_score);
        CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_nodes(concept_type);
        CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_relevance ON knowledge_nodes(relevance_score);
        CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_type ON knowledge_relationships(relationship_type);
        CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_strength ON knowledge_relationships(strength);
        
        -- Full-text search indices
        CREATE INDEX IF NOT EXISTS idx_youtube_content_title_fts ON youtube_content USING gin(to_tsvector('english', title));
        CREATE INDEX IF NOT EXISTS idx_youtube_content_description_fts ON youtube_content USING gin(to_tsvector('english', description));
        CREATE INDEX IF NOT EXISTS idx_intelligent_actions_title_fts ON intelligent_actions USING gin(to_tsvector('english', title));
        CREATE INDEX IF NOT EXISTS idx_intelligent_actions_description_fts ON intelligent_actions USING gin(to_tsvector('english', description));
        
        -- Analytics and insights materialized views
        CREATE MATERIALIZED VIEW IF NOT EXISTS knowledge_analytics AS
        SELECT 
            concept_type,
            COUNT(*) as concept_count,
            AVG(relevance_score) as avg_relevance,
            MAX(last_updated) as latest_update,
            SUM(occurrence_count) as total_occurrences
        FROM knowledge_nodes 
        GROUP BY concept_type;
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_analytics_type ON knowledge_analytics(concept_type);
        """
        
        async with self.pg_pool.acquire() as conn:
            await conn.execute(schema_sql)
            logger.info("PostgreSQL schema created successfully")
    
    async def _create_neo4j_schema(self):
        """Create Neo4j schema and constraints."""
        if not self.neo4j_driver:
            return
        
        constraints_cypher = """
        CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE;
        CREATE CONSTRAINT action_id IF NOT EXISTS FOR (a:Action) REQUIRE a.id IS UNIQUE;
        CREATE INDEX concept_type IF NOT EXISTS FOR (c:Concept) ON (c.type);
        CREATE INDEX concept_relevance IF NOT EXISTS FOR (c:Concept) ON (c.relevance_score);
        CREATE INDEX relationship_strength IF NOT EXISTS FOR ()-[r:RELATES_TO]-() ON (r.strength);
        """
        
        async with self.neo4j_driver.session() as session:
            for constraint in constraints_cypher.strip().split(';'):
                if constraint.strip():
                    try:
                        await session.run(constraint)
                    except Exception as e:
                        logger.debug("Neo4j constraint/index already exists", error=str(e))
        
        logger.info("Neo4j schema created successfully")
    
    # Content Management
    async def store_youtube_content(self, content_data: Dict[str, Any]) -> str:
        """Store YouTube content analysis in database."""
        logger.info("Storing YouTube content", url=content_data.get("url"))
        
        async with self.pg_pool.acquire() as conn:
            content_id = await conn.fetchval(
                """
                INSERT INTO youtube_content (id, url, title, description, transcript, metadata, analysis_results)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (url) 
                DO UPDATE SET 
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    transcript = EXCLUDED.transcript,
                    metadata = EXCLUDED.metadata,
                    analysis_results = EXCLUDED.analysis_results,
                    updated_at = NOW()
                RETURNING id
                """,
                content_data["id"],
                content_data["url"],
                content_data["video_data"]["metadata"].get("title"),
                content_data["video_data"]["metadata"].get("description"),
                content_data["video_data"].get("transcript"),
                json.dumps(content_data["video_data"]["metadata"]),
                json.dumps(content_data["ai_insights"])
            )
            
            return str(content_id)
    
    async def store_analysis_result(self, url: str, title: str, analysis_data: Dict[str, Any]) -> str:
        """Store analysis result in database."""
        logger.info("Storing analysis result", url=url)
        
        # Generate a unique ID for this analysis
        analysis_id = str(uuid.uuid4())
        
        # Store in a simplified format (you may want to create a proper table for this)
        async with self.pg_pool.acquire() as conn:
            # For now, we'll store this as youtube content since the table structure fits
            content_id = await conn.fetchval(
                """
                INSERT INTO youtube_content (id, url, title, description, transcript, metadata, analysis_results)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (url) 
                DO UPDATE SET 
                    title = EXCLUDED.title,
                    analysis_results = EXCLUDED.analysis_results,
                    updated_at = NOW()
                RETURNING id
                """,
                analysis_id,
                url,
                title,
                "Analysis completed",  # description
                "",  # transcript
                json.dumps({"analysis_timestamp": datetime.utcnow().isoformat()}),  # metadata
                json.dumps(analysis_data)  # analysis_results
            )
            
            return str(content_id)
    
    async def store_intelligent_action(self, action_data: Dict[str, Any], content_id: str) -> str:
        """Store intelligent action in database."""
        logger.info("Storing intelligent action", action_id=action_data.get("id"))
        
        action = action_data["action"]
        ratings = action_data["ratings"]
        context_rating = action_data["context_rating"]
        
        async with self.pg_pool.acquire() as conn:
            action_id = await conn.fetchval(
                """
                INSERT INTO intelligent_actions 
                (id, content_id, action_type, title, description, implementation_plan, 
                 feasibility_score, impact_score, context_rating, tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
                """,
                action_data["id"],
                content_id,
                action.get("type", "unknown"),
                action.get("title", ""),
                action.get("description", ""),
                json.dumps(action.get("implementation_plan", [])),
                ratings.get("feasibility", 0.5),
                ratings.get("impact", 0.5),
                json.dumps(context_rating),
                action.get("tags", [])
            )
            
            return str(action_id)
    
    # Knowledge Graph Operations
    async def create_concept_node(self, concept_name: str, concept_type: str, properties: Dict[str, Any]) -> str:
        """Create or update a concept node in the knowledge graph."""
        logger.debug("Creating concept node", concept=concept_name, type=concept_type)
        
        async with self.pg_pool.acquire() as conn:
            # Check if concept already exists
            existing_id = await conn.fetchval(
                "SELECT id FROM knowledge_nodes WHERE concept_name = $1 AND concept_type = $2",
                concept_name, concept_type
            )
            
            if existing_id:
                # Update existing concept
                await conn.execute(
                    """
                    UPDATE knowledge_nodes 
                    SET properties = $1, last_updated = NOW(), occurrence_count = occurrence_count + 1
                    WHERE id = $2
                    """,
                    json.dumps(properties), existing_id
                )
                return str(existing_id)
            else:
                # Create new concept
                concept_id = await conn.fetchval(
                    """
                    INSERT INTO knowledge_nodes (concept_name, concept_type, properties, relevance_score)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                    """,
                    concept_name, concept_type, json.dumps(properties), 
                    properties.get("relevance_score", 0.5)
                )
                
                # Also create in Neo4j if available
                if self.neo4j_driver:
                    await self._create_neo4j_concept(concept_id, concept_name, concept_type, properties)
                
                return str(concept_id)
    
    async def store_concept(
        self,
        concept_name: str,
        concept_type: str,
        properties: Dict[str, Any],
        source_url: str = "",
        relevance_score: float = 0.5
    ) -> str:
        """Store a concept in the knowledge graph (wrapper for create_concept_node)."""
        properties = dict(properties)  # Make a copy
        properties["source_url"] = source_url
        properties["relevance_score"] = relevance_score
        
        return await self.create_concept_node(concept_name, concept_type, properties)
    
    async def _create_neo4j_concept(self, concept_id: str, concept_name: str, concept_type: str, properties: Dict[str, Any]):
        """Create concept in Neo4j for advanced graph queries."""
        async with self.neo4j_driver.session() as session:
            await session.run(
                """
                MERGE (c:Concept {name: $name, type: $type})
                SET c.id = $id, c.relevance_score = $relevance, c.created_at = datetime()
                """,
                name=concept_name, type=concept_type, id=concept_id,
                relevance=properties.get("relevance_score", 0.5)
            )
    
    async def create_relationship(self, from_concept_id: str, to_concept_id: str, relationship_type: str, strength: float) -> str:
        """Create relationship between concepts."""
        logger.debug("Creating relationship", from_id=from_concept_id, to_id=to_concept_id, type=relationship_type)
        
        async with self.pg_pool.acquire() as conn:
            rel_id = await conn.fetchval(
                """
                INSERT INTO knowledge_relationships (from_node, to_node, relationship_type, strength)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (from_node, to_node, relationship_type)
                DO UPDATE SET strength = EXCLUDED.strength, updated_at = NOW()
                RETURNING id
                """,
                from_concept_id, to_concept_id, relationship_type, strength
            )
            
            # Also create in Neo4j if available
            if self.neo4j_driver:
                await self._create_neo4j_relationship(from_concept_id, to_concept_id, relationship_type, strength)
            
            return str(rel_id)
    
    async def _create_neo4j_relationship(self, from_concept_id: str, to_concept_id: str, relationship_type: str, strength: float):
        """Create relationship in Neo4j."""
        async with self.neo4j_driver.session() as session:
            await session.run(
                """
                MATCH (from:Concept {id: $from_id}), (to:Concept {id: $to_id})
                MERGE (from)-[r:RELATES_TO {type: $rel_type}]->(to)
                SET r.strength = $strength, r.updated_at = datetime()
                """,
                from_id=from_concept_id, to_id=to_concept_id, 
                rel_type=relationship_type, strength=strength
            )
    
    # Query Operations
    async def get_related_concepts(self, concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Find concepts related to the given concepts."""
        if not concepts:
            return []
        
        concept_names = [c["name"] for c in concepts]
        
        async with self.pg_pool.acquire() as conn:
            related = await conn.fetch(
                """
                SELECT DISTINCT n.*, r.relationship_type, r.strength
                FROM knowledge_nodes n
                JOIN knowledge_relationships r ON (r.to_node = n.id OR r.from_node = n.id)
                JOIN knowledge_nodes source ON (
                    (r.from_node = source.id AND source.concept_name = ANY($1)) OR
                    (r.to_node = source.id AND source.concept_name = ANY($1))
                )
                WHERE n.concept_name != ALL($1)
                ORDER BY r.strength DESC, n.relevance_score DESC
                LIMIT 50
                """,
                concept_names
            )
            
            return [dict(row) for row in related]
    
    async def search_concepts(self, query: str, concept_type: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Search concepts using full-text search."""
        async with self.pg_pool.acquire() as conn:
            if concept_type:
                results = await conn.fetch(
                    """
                    SELECT *, ts_rank(to_tsvector('english', concept_name), plainto_tsquery('english', $1)) as rank
                    FROM knowledge_nodes
                    WHERE concept_type = $2 AND to_tsvector('english', concept_name) @@ plainto_tsquery('english', $1)
                    ORDER BY rank DESC, relevance_score DESC
                    LIMIT $3
                    """,
                    query, concept_type, limit
                )
            else:
                results = await conn.fetch(
                    """
                    SELECT *, ts_rank(to_tsvector('english', concept_name), plainto_tsquery('english', $1)) as rank
                    FROM knowledge_nodes
                    WHERE to_tsvector('english', concept_name) @@ plainto_tsquery('english', $1)
                    ORDER BY rank DESC, relevance_score DESC
                    LIMIT $2
                    """,
                    query, limit
                )
            
            return [dict(row) for row in results]
    
    async def get_knowledge_analytics(self) -> Dict[str, Any]:
        """Get analytics about the knowledge graph."""
        async with self.pg_pool.acquire() as conn:
            # Refresh materialized view
            await conn.execute("REFRESH MATERIALIZED VIEW knowledge_analytics")
            
            analytics = await conn.fetch("SELECT * FROM knowledge_analytics ORDER BY concept_count DESC")
            
            total_concepts = await conn.fetchval("SELECT COUNT(*) FROM knowledge_nodes")
            total_relationships = await conn.fetchval("SELECT COUNT(*) FROM knowledge_relationships")
            
            return {
                "total_concepts": total_concepts,
                "total_relationships": total_relationships,
                "concept_distribution": [dict(row) for row in analytics],
                "last_updated": datetime.utcnow().isoformat()
            }
    
    async def get_trending_concepts(self, days: int = 7, limit: int = 10) -> List[Dict[str, Any]]:
        """Get trending concepts based on recent activity."""
        async with self.pg_pool.acquire() as conn:
            trending = await conn.fetch(
                """
                SELECT n.*, COUNT(a.id) as recent_mentions
                FROM knowledge_nodes n
                LEFT JOIN intelligent_actions a ON a.id = ANY(n.source_actions)
                WHERE n.last_updated >= NOW() - INTERVAL '%s days'
                GROUP BY n.id
                ORDER BY recent_mentions DESC, n.occurrence_count DESC, n.relevance_score DESC
                LIMIT $1
                """ % days,
                limit
            )
            
            return [dict(row) for row in trending]
    
    # Advanced Neo4j Queries (if available)
    async def find_concept_paths(self, from_concept: str, to_concept: str, max_depth: int = 3) -> List[Dict[str, Any]]:
        """Find paths between concepts using Neo4j."""
        if not self.neo4j_driver:
            return []
        
        async with self.neo4j_driver.session() as session:
            result = await session.run(
                """
                MATCH path = shortestPath((from:Concept {name: $from})-[*1..$max_depth]-(to:Concept {name: $to}))
                RETURN path, length(path) as path_length
                ORDER BY path_length
                LIMIT 10
                """,
                from_concept=from_concept, to_concept=to_concept, max_depth=max_depth
            )
            
            paths = []
            async for record in result:
                path = record["path"]
                path_data = {
                    "length": record["path_length"],
                    "nodes": [node["name"] for node in path.nodes],
                    "relationships": [rel["type"] for rel in path.relationships]
                }
                paths.append(path_data)
            
            return paths
    
    async def close(self):
        """Close database connections."""
        if self.pg_pool:
            await self.pg_pool.close()
        
        if self.neo4j_driver:
            await self.neo4j_driver.close()
        
        logger.info("Knowledge database connections closed")
